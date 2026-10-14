export const ZONES = [
  { id: 'fridge', icon: '🧊', name: 'Холодильник' },
  { id: 'freezer', icon: '❄️', name: 'Морозильник' },
  { id: 'pantry', icon: '📦', name: 'Кладовая' },
  { id: 'hot', icon: '🔥', name: 'Горячий цех' },
  { id: 'cold', icon: '🧊', name: 'Холодный цех' },
  { id: 'prep', icon: '🔪', name: 'Заготовка' },
  { id: 'sushi', icon: '🍣', name: 'Суши' },
  { id: 'hosper', icon: '🍖', name: 'Хоспер' },
  { id: 'bar', icon: '🍸', name: 'Бар' },
];

export const getZoneById = (id) => ZONES.find((z) => z.id === id);
