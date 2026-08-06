window.INGREDIENT_CATEGORIES = [
  { id: 'all', name: 'Все продукты' },
  { id: 'common', name: 'Часто используемые' },
  { id: 'meat', name: 'Мясо и птица' },
  { id: 'dairy', name: 'Молочные продукты и яйца' },
  { id: 'vegetables', name: 'Овощи и зелень' },
  { id: 'grains', name: 'Крупы, макароны и хлеб' },
  { id: 'legumes', name: 'Бобовые' }
];

window.INGREDIENTS = [
  { id:'chicken_fillet', name:'Куриное филе', category:'meat', common:true, aliases:['курица','грудка','филе курицы'] },
  { id:'chicken_thighs', name:'Куриные бёдра', category:'meat', common:false, aliases:['бедра курицы','куриные бедрышки'] },
  { id:'beef', name:'Говядина (мякоть)', category:'meat', common:true, aliases:['говядина','мясо говядины'] },
  { id:'lamb', name:'Баранина (мякоть)', category:'meat', common:true, aliases:['баранина','мясо баранины'] },
  { id:'minced_beef', name:'Фарш говяжий', category:'meat', common:true, aliases:['говяжий фарш','фарш из говядины'] },
  { id:'minced_lamb', name:'Фарш бараний', category:'meat', common:false, aliases:['бараний фарш','фарш из баранины'] },
  { id:'minced_chicken', name:'Фарш куриный', category:'meat', common:false, aliases:['куриный фарш','фарш из курицы'] },
  { id:'cooked_sausage', name:'Колбаса варёная', category:'meat', common:true, aliases:['вареная колбаса','докторская колбаса'] },

  { id:'eggs', name:'Яйца', category:'dairy', common:true, aliases:['яйцо'] },
  { id:'hard_cheese', name:'Сыр твёрдый', category:'dairy', common:true, aliases:['сыр','твердый сыр'] },
  { id:'cottage_cheese', name:'Творог', category:'dairy', common:true, aliases:['творожок'] },
  { id:'milk', name:'Молоко', category:'dairy', common:true, aliases:[] },
  { id:'sour_cream', name:'Сметана', category:'dairy', common:true, aliases:[] },
  { id:'yogurt', name:'Йогурт натуральный', category:'dairy', common:false, aliases:['натуральный йогурт','йогурт без сахара'] },

  { id:'potato', name:'Картофель', category:'vegetables', common:true, aliases:['картошка'] },
  { id:'onion', name:'Лук репчатый', category:'vegetables', common:true, aliases:['лук'] },
  { id:'carrot', name:'Морковь', category:'vegetables', common:true, aliases:[] },
  { id:'tomato', name:'Помидоры', category:'vegetables', common:true, aliases:['помидор','томаты','томат'] },
  { id:'cucumber', name:'Огурцы', category:'vegetables', common:true, aliases:['огурец'] },
  { id:'cabbage', name:'Капуста белокочанная', category:'vegetables', common:true, aliases:['капуста'] },
  { id:'sweet_pepper', name:'Перец сладкий', category:'vegetables', common:false, aliases:['болгарский перец','сладкий перец'] },
  { id:'garlic', name:'Чеснок', category:'vegetables', common:true, aliases:[] },
  { id:'zucchini', name:'Кабачок', category:'vegetables', common:false, aliases:['кабачки'] },
  { id:'eggplant', name:'Баклажан', category:'vegetables', common:false, aliases:['баклажаны','синенькие'] },
  { id:'mushrooms', name:'Шампиньоны', category:'vegetables', common:false, aliases:['грибы','шампиньон'] },
  { id:'greens', name:'Свежая зелень', category:'vegetables', common:false, aliases:['зелень','укроп','петрушка','кинза'] },

  { id:'rice', name:'Рис', category:'grains', common:true, aliases:[] },
  { id:'buckwheat', name:'Гречка', category:'grains', common:true, aliases:['гречневая крупа'] },
  { id:'pasta', name:'Макароны', category:'grains', common:true, aliases:['паста','спагетти','рожки'] },
  { id:'oats', name:'Овсяные хлопья', category:'grains', common:false, aliases:['овсянка','геркулес'] },
  { id:'bread', name:'Хлеб или батон', category:'grains', common:true, aliases:['хлеб','батон'] },

  { id:'lentils', name:'Чечевица', category:'legumes', common:false, aliases:[] },
  { id:'cooked_beans', name:'Фасоль готовая или консервированная', category:'legumes', common:false, aliases:['фасоль','консервированная фасоль','готовая фасоль'] }
];

window.PANTRY_INGREDIENTS = [
  { id:'water', name:'Вода', defaultChecked:true },
  { id:'salt', name:'Соль', defaultChecked:true },
  { id:'black_pepper', name:'Чёрный перец', defaultChecked:true },
  { id:'vegetable_oil', name:'Растительное масло', defaultChecked:true },
  { id:'butter', name:'Сливочное масло', defaultChecked:false },
  { id:'olive_oil', name:'Оливковое масло', defaultChecked:false },
  { id:'flour', name:'Мука', defaultChecked:false },
  { id:'sugar', name:'Сахар', defaultChecked:false },
  { id:'tomato_paste', name:'Томатная паста', defaultChecked:false }
];
