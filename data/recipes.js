window.RECIPES = [
  {
    id:'buckwheat_chicken', title:'Гречка с куриным филе и овощами', difficulty:'easy', servings:3,
    activeMinutes:20, totalMinutes:45, editorialPriority:0.95,
    ingredients:[
      {id:'chicken_fillet',amount:'350 г',role:'critical'}, {id:'buckwheat',amount:'180 г',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'carrot',amount:'1 шт.',role:'recommended'},
      {id:'vegetable_oil',amount:'15 мл',role:'pantry'}, {id:'water',amount:'420 мл',role:'pantry'},
      {id:'salt',amount:'¾ ч. л.',role:'pantry'}, {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ],
    substitutions:[], equipment:['Глубокая сковорода с крышкой'],
    steps:[
      {text:'Промойте гречку. Нарежьте лук и морковь. Куриное филе нарежьте отдельно кусочками примерно 2–3 см.',minutes:7},
      {text:'Разогрейте масло. Готовьте лук 3 минуты, затем добавьте морковь ещё на 4 минуты.',minutes:7},
      {text:'Добавьте курицу и готовьте, перемешивая, 6–8 минут до равномерного изменения цвета.',minutes:7},
      {text:'Добавьте гречку, воду, соль и перец. Доведите до слабого кипения.',minutes:3},
      {text:'Накройте крышкой и готовьте на слабом огне, пока вода не впитается и гречка не станет мягкой.',minutes:20},
      {text:'Проверьте полную готовность курицы и оставьте блюдо под крышкой на 5 минут.',minutes:5}
    ],
    safety:'Сырую курицу обрабатывайте отдельно от готовых продуктов. Перед подачей убедитесь, что мясо полностью приготовлено.'
  },
  {
    id:'chicken_rice', title:'Рис с куриным филе на одной сковороде', difficulty:'easy', servings:3,
    activeMinutes:20, totalMinutes:45, editorialPriority:0.94,
    ingredients:[
      {id:'chicken_fillet',amount:'350 г',role:'critical'}, {id:'rice',amount:'200 г',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'carrot',amount:'1 шт.',role:'recommended'},
      {id:'vegetable_oil',amount:'15 мл',role:'pantry'}, {id:'water',amount:'400–450 мл',role:'pantry'},
      {id:'salt',amount:'¾ ч. л.',role:'pantry'}, {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Глубокая сковорода с крышкой'],
    steps:[
      {text:'Промойте рис. Нарежьте овощи и отдельно нарежьте куриное филе.',minutes:8},
      {text:'На масле готовьте лук и морковь до мягкости.',minutes:6},
      {text:'Добавьте курицу и готовьте, перемешивая, 7–8 минут.',minutes:8},
      {text:'Добавьте рис, воду, соль и перец. Доведите до слабого кипения.',minutes:3},
      {text:'Готовьте под крышкой на слабом огне до мягкости риса и полной готовности курицы.',minutes:20}
    ], safety:'Не используйте одну доску для сырой курицы и готовых продуктов без тщательного мытья.'
  },
  {
    id:'chicken_potato', title:'Куриные бёдра с картофелем на сковороде', difficulty:'easy', servings:3,
    activeMinutes:20, totalMinutes:50, editorialPriority:0.91,
    ingredients:[
      {id:'chicken_thighs',amount:'500 г',role:'critical'}, {id:'potato',amount:'650 г',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'garlic',amount:'1 зубчик',role:'recommended'},
      {id:'vegetable_oil',amount:'15 мл',role:'pantry'}, {id:'water',amount:'100 мл',role:'pantry'},
      {id:'salt',amount:'1 ч. л.',role:'pantry'}, {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Большая сковорода с крышкой'],
    steps:[
      {text:'Нарежьте картофель средними кусочками, лук — полукольцами. Куриные бёдра промокните бумажным полотенцем.',minutes:8},
      {text:'Обжарьте курицу на масле по 4–5 минут с каждой стороны.',minutes:10},
      {text:'Добавьте лук и картофель, соль, перец и воду.',minutes:4},
      {text:'Накройте крышкой и готовьте на слабом огне до мягкости картофеля и полной готовности курицы.',minutes:25},
      {text:'При наличии добавьте измельчённый чеснок за 2 минуты до окончания.',minutes:2}
    ], safety:'Курица у кости должна быть полностью приготовлена; сок в самой толстой части не должен быть розовым.'
  },
  {
    id:'beef_potato_stew', title:'Тушёная говядина с картофелем', difficulty:'medium', servings:4,
    activeMinutes:25, totalMinutes:60, editorialPriority:0.94,
    ingredients:[
      {id:'beef',amount:'450 г',role:'critical'}, {id:'potato',amount:'700 г',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'carrot',amount:'1 шт.',role:'required'},
      {id:'tomato_paste',amount:'1 ст. л.',role:'recommended'}, {id:'vegetable_oil',amount:'20 мл',role:'pantry'},
      {id:'water',amount:'450 мл',role:'pantry'}, {id:'salt',amount:'1 ч. л.',role:'pantry'},
      {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Казан, сотейник или кастрюля с толстым дном'],
    steps:[
      {text:'Нарежьте говядину кубиками 2–3 см, картофель — крупными кусочками, лук и морковь — мельче.',minutes:12},
      {text:'Обжарьте говядину порциями до изменения цвета и лёгкой корочки.',minutes:10},
      {text:'Добавьте лук и морковь, готовьте 5 минут. При наличии вмешайте томатную пасту.',minutes:6},
      {text:'Добавьте воду, накройте и тушите на слабом огне 20 минут.',minutes:20},
      {text:'Добавьте картофель, соль и перец. Готовьте до мягкости картофеля и мяса.',minutes:20}
    ], safety:'Говядина должна быть полностью приготовлена и легко разрезаться. Не допускайте выкипания всей жидкости.'
  },
  {
    id:'lamb_rice', title:'Рис с бараниной и морковью', difficulty:'medium', servings:4,
    activeMinutes:25, totalMinutes:60, editorialPriority:0.95,
    ingredients:[
      {id:'lamb',amount:'450 г',role:'critical'}, {id:'rice',amount:'250 г',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'carrot',amount:'2 шт.',role:'required'},
      {id:'garlic',amount:'2 зубчика',role:'recommended'}, {id:'vegetable_oil',amount:'25 мл',role:'pantry'},
      {id:'water',amount:'500 мл',role:'pantry'}, {id:'salt',amount:'1 ч. л.',role:'pantry'},
      {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Казан или глубокая сковорода с крышкой'],
    steps:[
      {text:'Промойте рис. Нарежьте баранину кусочками, лук — полукольцами, морковь — соломкой.',minutes:12},
      {text:'Обжарьте баранину на масле до изменения цвета и лёгкой корочки.',minutes:10},
      {text:'Добавьте лук и морковь, готовьте до размягчения.',minutes:8},
      {text:'Добавьте воду, соль и перец. Тушите под крышкой 15 минут.',minutes:15},
      {text:'Распределите рис сверху, при наличии добавьте чеснок. Готовьте под крышкой до мягкости риса.',minutes:22}
    ], safety:'Проверьте, что баранина полностью приготовлена. Количество воды может потребовать корректировки в зависимости от сорта риса.'
  },
  {
    id:'pasta_minced_beef', title:'Макароны с говяжьим фаршем и томатами', difficulty:'easy', servings:3,
    activeMinutes:22, totalMinutes:30, editorialPriority:0.96,
    ingredients:[
      {id:'pasta',amount:'250 г',role:'critical'}, {id:'minced_beef',amount:'300 г',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'tomato',amount:'2 шт.',role:'recommended'},
      {id:'tomato_paste',amount:'1 ст. л.',role:'recommended'}, {id:'vegetable_oil',amount:'15 мл',role:'pantry'},
      {id:'salt',amount:'¾ ч. л.',role:'pantry'}, {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ],
    substitutions:[
      {from:'minced_beef',to:'minced_lamb',note:'Вкус станет более насыщенным; тщательно приготовьте фарш.'},
      {from:'minced_beef',to:'minced_chicken',note:'Куриный фарш готовится быстрее; не пересушите.'}
    ], equipment:['Кастрюля','Сковорода'],
    steps:[
      {text:'Поставьте воду для макарон. Нарежьте лук и помидоры.',minutes:5},
      {text:'На масле готовьте лук до мягкости.',minutes:4},
      {text:'Добавьте фарш и готовьте, разбивая комочки, до полного изменения цвета.',minutes:8},
      {text:'Добавьте помидоры и при наличии томатную пасту. Готовьте до образования соуса.',minutes:7},
      {text:'Отварите макароны по времени на упаковке, слейте воду и соедините с соусом.',minutes:10}
    ], safety:'Фарш должен быть полностью приготовлен, без розовых участков.'
  },
  {
    id:'cabbage_minced', title:'Тушёная капуста с фаршем', difficulty:'easy', servings:4,
    activeMinutes:20, totalMinutes:45, editorialPriority:0.90,
    ingredients:[
      {id:'cabbage',amount:'700 г',role:'critical'}, {id:'minced_beef',amount:'300 г',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'carrot',amount:'1 шт.',role:'recommended'},
      {id:'vegetable_oil',amount:'15 мл',role:'pantry'}, {id:'water',amount:'100 мл',role:'pantry'},
      {id:'salt',amount:'1 ч. л.',role:'pantry'}, {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ],
    substitutions:[
      {from:'minced_beef',to:'minced_lamb',note:'Допустимая замена; вкус станет более выраженным.'},
      {from:'minced_beef',to:'minced_chicken',note:'Куриный фарш готовится быстрее.'}
    ], equipment:['Глубокая сковорода или сотейник'],
    steps:[
      {text:'Нашинкуйте капусту. Нарежьте лук и морковь.',minutes:10},
      {text:'На масле готовьте лук и морковь до мягкости.',minutes:6},
      {text:'Добавьте фарш и готовьте, разбивая комочки, до полного изменения цвета.',minutes:9},
      {text:'Добавьте капусту, воду, соль и перец. Накройте крышкой.',minutes:4},
      {text:'Тушите до мягкости капусты и полной готовности фарша.',minutes:22}
    ], safety:'Фарш должен быть полностью приготовлен.'
  },
  {
    id:'chicken_cutlets', title:'Котлеты из куриного фарша', difficulty:'medium', servings:3,
    activeMinutes:25, totalMinutes:35, editorialPriority:0.88,
    ingredients:[
      {id:'minced_chicken',amount:'450 г',role:'critical'}, {id:'eggs',amount:'1 шт.',role:'required'},
      {id:'onion',amount:'½ шт.',role:'recommended'}, {id:'bread',amount:'1 ломтик',role:'recommended'},
      {id:'vegetable_oil',amount:'20 мл',role:'pantry'}, {id:'salt',amount:'¾ ч. л.',role:'pantry'},
      {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Миска','Сковорода с крышкой'],
    steps:[
      {text:'Мелко нарежьте или натрите лук. При наличии размочите хлеб в небольшом количестве воды.',minutes:6},
      {text:'Смешайте фарш, яйцо, лук, хлеб, соль и перец. Сформируйте одинаковые котлеты.',minutes:9},
      {text:'Обжарьте котлеты на среднем огне по 4–5 минут с каждой стороны.',minutes:10},
      {text:'Накройте крышкой и доведите до полной готовности на слабом огне.',minutes:7}
    ], safety:'Куриный фарш должен быть полностью приготовлен внутри. После контакта с сырым фаршем вымойте руки и инвентарь.'
  },
  {
    id:'omelet_cheese', title:'Омлет с сыром и помидорами', difficulty:'easy', servings:2,
    activeMinutes:10, totalMinutes:15, editorialPriority:0.93,
    ingredients:[
      {id:'eggs',amount:'4 шт.',role:'critical'}, {id:'hard_cheese',amount:'70 г',role:'recommended'},
      {id:'tomato',amount:'1 шт.',role:'recommended'}, {id:'milk',amount:'50 мл',role:'recommended'},
      {id:'butter',amount:'10 г',role:'pantry'}, {id:'salt',amount:'¼ ч. л.',role:'pantry'}
    ],
    substitutions:[{from:'butter',to:'vegetable_oil',note:'Используйте около 1 ч. л.; вкус будет менее сливочным.'}],
    equipment:['Сковорода с крышкой'],
    steps:[
      {text:'Нарежьте помидор и натрите сыр.',minutes:4},
      {text:'Взбейте яйца с молоком и солью.',minutes:2},
      {text:'Смажьте сковороду маслом, вылейте яйца, добавьте помидор и сыр.',minutes:2},
      {text:'Готовьте под крышкой на слабом огне до полного схватывания центра.',minutes:6}
    ], safety:'Для детей, беременных и людей с ослабленным иммунитетом не оставляйте сырой жидкий центр.'
  },
  {
    id:'omelet_sausage', title:'Омлет с варёной колбасой', difficulty:'easy', servings:2,
    activeMinutes:10, totalMinutes:15, editorialPriority:0.86,
    ingredients:[
      {id:'eggs',amount:'4 шт.',role:'critical'}, {id:'cooked_sausage',amount:'100 г',role:'critical'},
      {id:'milk',amount:'50 мл',role:'recommended'}, {id:'tomato',amount:'1 шт.',role:'recommended'},
      {id:'butter',amount:'10 г',role:'pantry'}, {id:'salt',amount:'1 щепотка',role:'pantry'}
    ], substitutions:[{from:'butter',to:'vegetable_oil',note:'Достаточно 1 ч. л.'}], equipment:['Сковорода с крышкой'],
    steps:[
      {text:'Нарежьте колбасу и при наличии помидор небольшими кусочками.',minutes:4},
      {text:'Слегка прогрейте колбасу на сковороде.',minutes:3},
      {text:'Взбейте яйца с молоком и солью, вылейте в сковороду.',minutes:2},
      {text:'Готовьте под крышкой на слабом огне до полного схватывания.',minutes:6}
    ], safety:'Используйте свежую колбасу и не оставляйте готовый омлет надолго при комнатной температуре.'
  },
  {
    id:'potato_eggs', title:'Картофель с яйцом на сковороде', difficulty:'easy', servings:3,
    activeMinutes:18, totalMinutes:35, editorialPriority:0.89,
    ingredients:[
      {id:'potato',amount:'600 г',role:'critical'}, {id:'eggs',amount:'3 шт.',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'recommended'}, {id:'vegetable_oil',amount:'20 мл',role:'pantry'},
      {id:'salt',amount:'¾ ч. л.',role:'pantry'}, {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Сковорода с крышкой'],
    steps:[
      {text:'Очистите и нарежьте картофель небольшими одинаковыми кусочками.',minutes:8},
      {text:'Готовьте картофель на масле под крышкой, периодически перемешивая.',minutes:18},
      {text:'При наличии добавьте лук и готовьте до мягкости.',minutes:5},
      {text:'Добавьте яйца, соль и перец. Готовьте до полного схватывания белка.',minutes:5}
    ], safety:'Картофель должен быть мягким внутри, яйца — полностью приготовленными.'
  },
  {
    id:'lentil_soup', title:'Суп из чечевицы с картофелем', difficulty:'easy', servings:4,
    activeMinutes:15, totalMinutes:40, editorialPriority:0.92,
    ingredients:[
      {id:'lentils',amount:'220 г',role:'critical'}, {id:'potato',amount:'2 шт.',role:'required'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'carrot',amount:'1 шт.',role:'recommended'},
      {id:'vegetable_oil',amount:'10 мл',role:'pantry'}, {id:'water',amount:'1,4 л',role:'pantry'},
      {id:'salt',amount:'1 ч. л.',role:'pantry'}, {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Кастрюля'],
    steps:[
      {text:'Переберите и промойте чечевицу. Нарежьте овощи.',minutes:10},
      {text:'На масле прогрейте лук и морковь до мягкости.',minutes:5},
      {text:'Добавьте картофель, чечевицу и воду. Доведите до слабого кипения.',minutes:4},
      {text:'Варите до мягкости чечевицы и картофеля. В конце посолите и поперчите.',minutes:25}
    ], safety:'Осторожно работайте с горячей жидкостью. Не переполняйте кастрюлю.'
  },
  {
    id:'rice_vegetables', title:'Рис с овощами', difficulty:'easy', servings:3,
    activeMinutes:15, totalMinutes:35, editorialPriority:0.86,
    ingredients:[
      {id:'rice',amount:'200 г',role:'critical'}, {id:'onion',amount:'1 шт.',role:'required'},
      {id:'carrot',amount:'1 шт.',role:'recommended'}, {id:'sweet_pepper',amount:'1 шт.',role:'recommended'},
      {id:'vegetable_oil',amount:'15 мл',role:'pantry'}, {id:'water',amount:'400 мл',role:'pantry'},
      {id:'salt',amount:'¾ ч. л.',role:'pantry'}
    ], substitutions:[{from:'sweet_pepper',to:'tomato',note:'Добавьте помидор ближе к концу, чтобы рис не стал слишком влажным.'}], equipment:['Кастрюля','Сковорода'],
    steps:[
      {text:'Промойте рис и приготовьте его с водой и солью до мягкости.',minutes:22},
      {text:'Нарежьте овощи небольшими одинаковыми кусочками.',minutes:7},
      {text:'На масле готовьте лук, морковь и перец до мягкости.',minutes:10},
      {text:'Соедините овощи с готовым рисом и прогрейте.',minutes:3}
    ], safety:'Готовый рис не оставляйте надолго при комнатной температуре; остатки быстро охладите.'
  },
  {
    id:'beans_tomato', title:'Фасоль с помидорами и луком', difficulty:'easy', servings:3,
    activeMinutes:15, totalMinutes:25, editorialPriority:0.85,
    ingredients:[
      {id:'cooked_beans',amount:'400 г',role:'critical'}, {id:'tomato',amount:'2 шт.',role:'required'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'garlic',amount:'1 зубчик',role:'recommended'},
      {id:'vegetable_oil',amount:'15 мл',role:'pantry'}, {id:'salt',amount:'½ ч. л.',role:'pantry'},
      {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Сковорода'],
    steps:[
      {text:'Если фасоль консервированная, слейте жидкость и промойте её.',minutes:3},
      {text:'Нарежьте лук и помидоры. При наличии измельчите чеснок.',minutes:5},
      {text:'На масле готовьте лук до мягкости, затем добавьте помидоры.',minutes:8},
      {text:'Добавьте фасоль, соль и перец. Прогрейте до равномерно горячего состояния.',minutes:7}
    ], safety:'Не используйте сухую фасоль без предварительного полного замачивания и приготовления.'
  },
  {
    id:'hot_sandwich', title:'Горячие бутерброды с сыром и помидорами', difficulty:'easy', servings:2,
    activeMinutes:8, totalMinutes:15, editorialPriority:0.82,
    ingredients:[
      {id:'bread',amount:'4 ломтика',role:'critical'}, {id:'hard_cheese',amount:'100 г',role:'critical'},
      {id:'tomato',amount:'1 шт.',role:'recommended'}, {id:'butter',amount:'10 г',role:'recommended'}
    ], substitutions:[], equipment:['Духовка или сковорода с крышкой'],
    steps:[
      {text:'Нарежьте помидор и сыр. При наличии тонко смажьте хлеб сливочным маслом.',minutes:5},
      {text:'Выложите начинку на хлеб.',minutes:2},
      {text:'Готовьте до расплавления сыра и лёгкого подрумянивания хлеба.',minutes:8}
    ], safety:'Начинка и расплавленный сыр могут быть очень горячими.'
  },
  {
    id:'cucumber_yogurt_salad', title:'Салат из огурцов с йогуртовой заправкой', difficulty:'easy', servings:3,
    activeMinutes:10, totalMinutes:10, editorialPriority:0.80,
    ingredients:[
      {id:'cucumber',amount:'3 шт.',role:'critical'}, {id:'yogurt',amount:'150 г',role:'critical'},
      {id:'garlic',amount:'½ зубчика',role:'recommended'}, {id:'greens',amount:'2 ст. л.',role:'recommended'},
      {id:'salt',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[{from:'yogurt',to:'sour_cream',note:'Вкус станет более насыщенным, а заправка — гуще.'}], equipment:['Миска'],
    steps:[
      {text:'Вымойте и нарежьте огурцы.',minutes:5},
      {text:'Смешайте йогурт с солью, при наличии добавьте чеснок и зелень.',minutes:3},
      {text:'Соедините заправку с огурцами и подавайте сразу.',minutes:2}
    ], safety:'Используйте чистые овощи и свежий молочный продукт.'
  },
  {
    id:'pasta_cheese', title:'Макароны в сырном соусе', difficulty:'medium', servings:3,
    activeMinutes:20, totalMinutes:30, editorialPriority:0.90,
    ingredients:[
      {id:'pasta',amount:'250 г',role:'critical'}, {id:'hard_cheese',amount:'120 г',role:'critical'},
      {id:'milk',amount:'300 мл',role:'required'}, {id:'butter',amount:'20 г',role:'required'},
      {id:'flour',amount:'1 ст. л.',role:'required'}, {id:'salt',amount:'½ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Кастрюля','Сотейник или небольшая сковорода'],
    steps:[
      {text:'Отварите макароны по времени на упаковке.',minutes:12},
      {text:'Растопите сливочное масло, добавьте муку и перемешивайте 1 минуту.',minutes:2},
      {text:'Постепенно влейте молоко, постоянно перемешивая, чтобы не образовались комки.',minutes:6},
      {text:'Добавьте тёртый сыр и соль. Перемешайте до однородности на слабом огне.',minutes:4},
      {text:'Соедините соус с макаронами и подавайте сразу.',minutes:2}
    ], safety:'Не оставляйте молочный соус надолго при комнатной температуре.'
  },
  {
    id:'syrniki', title:'Сырники из творога', difficulty:'medium', servings:3,
    activeMinutes:20, totalMinutes:30, editorialPriority:0.91,
    ingredients:[
      {id:'cottage_cheese',amount:'400 г',role:'critical'}, {id:'eggs',amount:'1 шт.',role:'required'},
      {id:'flour',amount:'70–90 г',role:'required'}, {id:'sugar',amount:'1–2 ст. л.',role:'recommended'},
      {id:'vegetable_oil',amount:'20 мл',role:'pantry'}, {id:'salt',amount:'1 щепотка',role:'pantry'}
    ], substitutions:[], equipment:['Миска','Сковорода'],
    steps:[
      {text:'Смешайте творог, яйцо, соль и при наличии сахар.',minutes:5},
      {text:'Добавьте большую часть муки. Масса должна держать форму, но оставаться мягкой.',minutes:4},
      {text:'Сформируйте небольшие сырники и слегка обваляйте в оставшейся муке.',minutes:7},
      {text:'Готовьте на умеренном огне по 3–4 минуты с каждой стороны до румяности и прогревания внутри.',minutes:9}
    ], safety:'Используйте свежий творог. Яичная смесь должна полностью прогреться.'
  },
  {
    id:'cottage_cheese_greens', title:'Творог с йогуртом и зеленью', difficulty:'easy', servings:2,
    activeMinutes:8, totalMinutes:8, editorialPriority:0.79,
    ingredients:[
      {id:'cottage_cheese',amount:'300 г',role:'critical'}, {id:'yogurt',amount:'80 г',role:'recommended'},
      {id:'greens',amount:'2 ст. л.',role:'recommended'}, {id:'cucumber',amount:'1 шт.',role:'recommended'},
      {id:'salt',amount:'¼ ч. л.',role:'pantry'}, {id:'black_pepper',amount:'1 щепотка',role:'pantry'}
    ], substitutions:[{from:'yogurt',to:'sour_cream',note:'Используйте немного меньше, поскольку сметана гуще и жирнее.'}], equipment:['Миска'],
    steps:[
      {text:'Вымойте и мелко нарежьте зелень и огурец.',minutes:4},
      {text:'Смешайте творог с йогуртом или сметаной.',minutes:2},
      {text:'Добавьте зелень, огурец, соль и перец. Подавайте сразу.',minutes:2}
    ], safety:'Используйте свежие молочные продукты и чистую зелень.'
  },
  {
    id:'oatmeal_milk', title:'Овсяная каша на молоке', difficulty:'easy', servings:2,
    activeMinutes:8, totalMinutes:15, editorialPriority:0.85,
    ingredients:[
      {id:'oats',amount:'100 г',role:'critical'}, {id:'milk',amount:'350 мл',role:'critical'},
      {id:'water',amount:'150 мл',role:'pantry'}, {id:'butter',amount:'10 г',role:'recommended'},
      {id:'sugar',amount:'1 ст. л.',role:'recommended'}, {id:'salt',amount:'1 щепотка',role:'pantry'}
    ], substitutions:[], equipment:['Небольшая кастрюля'],
    steps:[
      {text:'Смешайте молоко, воду и соль. Нагрейте почти до кипения.',minutes:5},
      {text:'Добавьте овсяные хлопья и готовьте на слабом огне, помешивая.',minutes:7},
      {text:'При наличии добавьте сахар и сливочное масло. Оставьте под крышкой на 2 минуты.',minutes:2}
    ], safety:'Следите, чтобы молоко не убежало. Осторожно: каша долго остаётся горячей.'
  },
  {
    id:'zucchini_eggs', title:'Кабачок с яйцом на сковороде', difficulty:'easy', servings:2,
    activeMinutes:12, totalMinutes:25, editorialPriority:0.83,
    ingredients:[
      {id:'zucchini',amount:'500 г',role:'critical'}, {id:'eggs',amount:'3 шт.',role:'critical'},
      {id:'onion',amount:'½ шт.',role:'recommended'}, {id:'vegetable_oil',amount:'15 мл',role:'pantry'},
      {id:'salt',amount:'½ ч. л.',role:'pantry'}, {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Сковорода'],
    steps:[
      {text:'Нарежьте кабачок небольшими кубиками, при наличии нарежьте лук.',minutes:6},
      {text:'На масле готовьте лук и кабачок до мягкости и испарения лишней жидкости.',minutes:12},
      {text:'Добавьте яйца, соль и перец. Перемешайте и готовьте до полного схватывания.',minutes:5}
    ], safety:'Яйца должны быть полностью приготовлены.'
  },
  {
    id:'eggplant_tomato', title:'Тушёные баклажаны с помидорами', difficulty:'easy', servings:3,
    activeMinutes:15, totalMinutes:35, editorialPriority:0.82,
    ingredients:[
      {id:'eggplant',amount:'500 г',role:'critical'}, {id:'tomato',amount:'3 шт.',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'garlic',amount:'1 зубчик',role:'recommended'},
      {id:'vegetable_oil',amount:'20 мл',role:'pantry'}, {id:'salt',amount:'¾ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Глубокая сковорода'],
    steps:[
      {text:'Нарежьте баклажаны, помидоры и лук. При наличии измельчите чеснок.',minutes:8},
      {text:'На масле готовьте лук до мягкости.',minutes:5},
      {text:'Добавьте баклажаны и готовьте 10 минут, периодически перемешивая.',minutes:10},
      {text:'Добавьте помидоры и соль. Тушите до мягкости и загустения.',minutes:12},
      {text:'При наличии добавьте чеснок в конце приготовления.',minutes:1}
    ], safety:'Тщательно мойте овощи. Не используйте испорченные или горькие баклажаны.'
  },
  {
    id:'mushrooms_potato', title:'Картофель с шампиньонами', difficulty:'easy', servings:3,
    activeMinutes:18, totalMinutes:35, editorialPriority:0.87,
    ingredients:[
      {id:'potato',amount:'600 г',role:'critical'}, {id:'mushrooms',amount:'300 г',role:'critical'},
      {id:'onion',amount:'1 шт.',role:'required'}, {id:'vegetable_oil',amount:'20 мл',role:'pantry'},
      {id:'butter',amount:'10 г',role:'recommended'}, {id:'salt',amount:'¾ ч. л.',role:'pantry'},
      {id:'black_pepper',amount:'¼ ч. л.',role:'pantry'}
    ], substitutions:[], equipment:['Большая сковорода'],
    steps:[
      {text:'Очистите и нарежьте картофель, грибы и лук.',minutes:10},
      {text:'Готовьте картофель на растительном масле до полуготовности.',minutes:15},
      {text:'Добавьте лук и грибы. Готовьте до испарения жидкости и мягкости картофеля.',minutes:12},
      {text:'Посолите, поперчите и при наличии добавьте сливочное масло.',minutes:2}
    ], safety:'Используйте только свежие культурные грибы из надёжного источника. Шампиньоны должны быть полностью приготовлены.'
  }
];

// Редакционный контур 3.0: первые 10 рецептов прошли кабинетную
// проверку структуры и переданы в партию B1 для фактического приготовления.
// Статусы cooked/approved выставляются только после заполнения журнала проверки.
const EDITORIAL_BATCH_B1 = new Set([
  'buckwheat_chicken',
  'chicken_rice',
  'chicken_potato',
  'beef_potato_stew',
  'lamb_rice',
  'pasta_minced_beef',
  'cabbage_minced',
  'chicken_cutlets',
  'omelet_cheese',
  'omelet_sausage'
]);

window.RECIPES = window.RECIPES.map(recipe => {
  const inBatch = EDITORIAL_BATCH_B1.has(recipe.id);
  return {
    ...recipe,
    editorial: {
      version: inBatch ? '1.0-review' : '0.1-draft',
      status: inBatch ? 'reviewed' : 'draft',
      batch: inBatch ? 'B1' : null,
      cookedAt: null,
      approvedAt: null
    }
  };
});
