import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const pad = (n) => String(n).padStart(2, '0');

function formatDateRu(isoDate) {
    // "2026-10-17" → "17.10.2026"
    if (!isoDate) return '—';
    const [y, m, d] = isoDate.split('-');
    return `${d}.${m}.${y}`;
}

function todayRu() {
    const d = new Date();
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function dateToMonthKey(dateStr) {
    // "2026-10-17" → "2026-10"
    return dateStr.slice(0, 7);
}

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ
// type = 'product' | 'semi'
// ============================================
export async function downloadInventoryExcel({ date, type }) {
    // 1. Проверяем: есть ли хоть одна сессия за эту дату
    const sessQ = query(
        collection(db, 'inventory_sessions'),
        where('date', '==', date),
    );
    const sessSnap = await getDocs(sessQ);

    if (sessSnap.empty) {
        return { ok: false, reason: 'no-sessions' };
    }

    const sessions = sessSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 2. Какие зоны посчитаны за эту дату (для проверки "все ли зоны")
    const zonesWithSessions = new Set();
    sessions.forEach((s) => zonesWithSessions.add(s.zone));

    // 3. Загружаем все items всех сессий этой даты в одну Map
    //    Map: "zone|productId" → value
    const valueMap = new Map();
    for (const s of sessions) {
        const itemsSnap = await getDocs(
            collection(db, 'inventory_sessions', s.id, 'items'),
        );
        itemsSnap.docs.forEach((d) => {
            const data = d.data();
            valueMap.set(`${s.zone}|${d.id}`, data.value ?? null);
        });
    }

    // 4. Загружаем ВСЕ продукты нужного типа
    const prodQ = query(
        collection(db, 'products'),
        where('type', '==', type),
        where('isActive', '==', true),
    );
    const prodSnap = await getDocs(prodQ);
    const products = prodSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
            if (a.category !== b.category) {
                return (a.category || '').localeCompare(b.category || '', 'ru');
            }
            return (a.name || '').localeCompare(b.name || '', 'ru');
        });

    // 5. Строим Excel через exceljs
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Бланк инвентаризации');

    // Ширина колонок
    ws.columns = [
        { width: 10 }, // A: Код
        { width: 42 }, // B: Наименование
        { width: 10 }, // C: Ед. изм.
        { width: 18 }, // D: Остаток фактический
        { width: 18 }, // E: Отметки
    ];

    const thin = { style: 'thin', color: { argb: 'FF000000' } };
    const allBorders = {
        top: thin,
        bottom: thin,
        left: thin,
        right: thin,
    };

    // Строка 1: заголовок
    ws.mergeCells('A1:E1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'Бланк инвентаризации';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 24;

    // Пустая строка
    ws.addRow([]);

    // Шапка метаданных
    const metaRows = [
        ['На дату:', formatDateRu(date)],
        ['Подразделения:', 'Кухня'],
        ['Товарные группы:', type === 'product' ? 'ТОВАРЫ' : 'Полуфабрикаты'],
        ['Валюта отчета:', 'Рубль'],
        ['Способ группировки:', 'не группировать, по товарным группам'],
    ];

    metaRows.forEach(([label, value]) => {
        const row = ws.addRow([label, value]);
        ws.mergeCells(`B${row.number}:E${row.number}`);
        row.getCell(1).font = { size: 11 };
        row.getCell(2).font = { size: 11 };
        row.getCell(2).alignment = { horizontal: 'left' };
    });

    // Пустая строка
    ws.addRow([]);

    // Шапка таблицы (2 строки)
    // Верхняя: "Товар" на A:B, "Ед. изм." C, "Остаток фактический" D, "Отметки" E
    const headerTop = ws.addRow(['', '', 'Ед. изм.', 'Остаток фактический', 'Отметки']);
    ws.mergeCells(`A${headerTop.number}:B${headerTop.number}`);
    headerTop.getCell(1).value = 'Товар';
    headerTop.eachCell((cell) => {
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = allBorders;
    });

    // Нижняя: "Код" | "Наименование" | пусто | пусто | пусто
    const headerBot = ws.addRow(['Код', 'Наименование', '', '', '']);
    headerBot.eachCell((cell) => {
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = allBorders;
    });

    // Данные: группируем по категориям
    let lastCategory = null;
    products.forEach((p) => {
        const category = p.category || 'Без категории';

        // Строка категории
        if (category !== lastCategory) {
            const catRow = ws.addRow(['', '', '', '', '']);
            ws.mergeCells(`A${catRow.number}:E${catRow.number}`);
            catRow.getCell(1).value = category;
            catRow.getCell(1).font = { bold: true, size: 11 };
            catRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
            catRow.eachCell((cell) => {
                cell.border = allBorders;
            });
            lastCategory = category;
        }

        // Строка товара
        // Значение: ищем по всем зонам этого продукта
        let value = null;
        for (const z of zonesWithSessions) {
            const key = `${z}|${p.id}`;
            if (valueMap.has(key)) {
                const v = valueMap.get(key);
                if (v !== null && v !== undefined) {
                    value = v;
                    break;
                }
            }
        }

        const valDisplay =
            value === null || value === undefined || value === 0 ? '' : value;

        const row = ws.addRow([
            p.code || '',
            p.name || '',
            p.unit || '',
            valDisplay,
            '',
        ]);
        row.eachCell((cell) => {
            cell.border = allBorders;
            cell.font = { size: 11 };
        });
        // Остаток — по центру
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { horizontal: 'center' };
    });

    // Пустая строка и подпись "Дата печати"
    ws.addRow([]);
    const footerRow = ws.addRow(['Дата печати:', todayRu()]);
    ws.mergeCells(`B${footerRow.number}:E${footerRow.number}`);
    footerRow.getCell(1).font = { bold: true, size: 11 };
    footerRow.getCell(2).font = { size: 11 };

    // 6. Скачиваем файл
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const typeLabel = type === 'product' ? 'Товары' : 'ПФ';
    a.download = `${typeLabel}_${formatDateRu(date).replace(/\./g, '-')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    // Возвращаем инфо — какие зоны посчитаны, для модалки
    return {
        ok: true,
        zonesCount: zonesWithSessions.size,
        zones: Array.from(zonesWithSessions),
    };
}

// Дополнительная функция: узнать, какие зоны посчитаны на дату (без генерации файла)
export async function getZonesForDate(date) {
    const sessQ = query(
        collection(db, 'inventory_sessions'),
        where('date', '==', date),
    );
    const sessSnap = await getDocs(sessQ);
    const zones = new Set();
    sessSnap.docs.forEach((d) => zones.add(d.data().zone));
    return Array.from(zones);
}