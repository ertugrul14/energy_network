export const TRANSLATIONS = {
  en: {
    // Landing
    landing_title: 'ENERGY NETWORK',
    landing_subtitle: 'Trace the invisible cost of AI',
    landing_desc: 'Every AI prompt triggers a chain of energy, water, and emissions across the planet. Hold this tablet and follow the thread.',
    btn_start: 'START',

    // Onboarding
    onboard_purpose: 'Discover the hidden energy, water, and carbon footprint behind every AI request you make.',
    btn_learn_how: 'LEARN HOW TO DO',
    btn_next: 'NEXT',
    btn_begin: 'BEGIN EXHIBITION',
    onboard_step1_title: 'Select city & AI task',
    onboard_step1_desc: 'Pick your location and the AI operation to simulate.',
    onboard_step2_title: 'Choose a data center',
    onboard_step2_desc: 'Each server has different energy sources and climate costs.',
    onboard_step3_title: 'Light up the model',
    onboard_step3_desc: 'The physical model glows based on your city\'s energy use.',
    onboard_step4_title: 'Watch the big screen',
    onboard_step4_desc: 'See electricity, water, and CO₂ flow across the planet.',

    // Body Scale
    step1_tag: 'STEP 1',
    step1_title: 'BODY SCALE',
    step1_desc: 'Your prompt, your device, your energy',
    label_city: 'SELECT CITY',
    label_workload: 'SELECT AI OPERATION',
    label_datacenter: 'SELECT DATA CENTER',
    btn_consumption: 'CALCULATE ENERGY',

    // Body Result
    step1_result_tag: 'STEP 1 — RESULT',
    step1_result_desc: 'What does your prompt cost?',
    session_energy_label: 'YOUR SESSION ENERGY',
    kwh_unit: 'kWh used',
    btn_calc_info: 'How is this calculated?',
    btn_back: '← Back',
    btn_to_city: 'SIMULATE AT CITY SCALE →',

    // City Scale
    step2_tag: 'STEP 2',
    step2_title: 'CITY SCALE',
    step2_desc: 'Scale up to your city\'s AI users…',
    city_stat_label: 'kWh total energy',
    btn_connect_arduino: 'CONNECT ARDUINO',
    arduino_hint: 'Select a building type, then light up the physical model',
    btn_simulate: 'LIGHT UP MODEL',
    btn_restart: 'RESTART',
    btn_to_planetary: 'TRACE ENERGY FLOW →',

    // Planetary Scale
    step3_tag: 'STEP 3',
    step3_title: 'PLANETARY SCALE',
    step3_desc: 'Look up at the screen',
    planetary_desc: 'The energy flow simulation is now displayed on the large screen. Watch how your prompt\'s impact ripples across the planet — electricity grids, water sources, CO₂ drift, and material supply chains.',
    planetary_hint: 'The globe on the big screen is showing your energy flow in real time',
    btn_create_scenario: 'CREATE SCENARIO',
    btn_start_over: 'START OVER',

    // Scenario
    step4_tag: 'STEP 4',
    step4_title: 'REDESIGN YOUR CITY',
    step4_desc: 'What if you could reshape the infrastructure?',
    scenario_intro: 'Add urban components to your city and see how they change the energy flow, water use, and carbon emissions of your AI request.',
    scenario_impact: 'SCENARIO IMPACT',
    btn_apply_scenario: 'APPLY SCENARIO TO GLOBE',

    // Screen side panel
    sp_eyebrow: 'SINGLE AI OPERATION',
    sp_context: 'Resources used each time one person runs this AI task',
    sp_electricity: 'Electricity',
    sp_water: 'Water',
    sp_water_unit: 'litres used',
    sp_co2: 'CO₂ Emissions',
    sp_co2_unit: 'grams of CO₂',
    sp_distance: 'Distance',
    sp_distance_unit: 'kilometres travelled',
    sp_kwh_unit: 'kilowatt-hours',

    // Screen idle
    idle_title: 'ENERGY NETWORK',
    idle_subtitle: 'Waiting for tablet input…',
    idle_desc: 'Pick up the tablet to trace the invisible infrastructure of AI',

    // Screen legend
    legend_electricity: 'Electricity',
    legend_water: 'Water',
    legend_co2: 'CO₂ drift',
    legend_materials: 'Materials',

    // Comparison
    comparison_title: 'SCENARIO COMPARISON',
    comparison_subtitle: 'Your urban interventions changed the energy flow',
    comparison_current: 'CURRENT',
    comparison_scenario: 'SCENARIO',

    // Planetary stats
    stat_kwh: 'kWh used',
    stat_water: 'litres of water',
    stat_co2: 'gCO₂ emitted',
    stat_distance: 'km displaced',

    // Narratives
    narrative_standard: (data) =>
      `Your request traveled ${data.distanceKm.toLocaleString()} km to a server in ${data.datacenterLocation}. The electricity came from a grid that is ${Math.round(data.fossilPercent)}% fossil-fueled. ${data.waterLiters > 0 ? `${data.waterLiters.toFixed(1)} liters of water were used for cooling.` : 'Seawater cooling was used.'} ${data.co2Grams.toFixed(0)}g of CO₂ was released—it will drift ${data.emissionsDrift.direction} toward ${data.emissionsDrift.destinations[0].name}.`,

    // City scale dynamic text
    city_desc_template: (activeUsers, cityName, workloadName, totalKwh) =>
      `If ${activeUsers.toLocaleString()} people in ${cityName} each ran one ${workloadName} session, they'd use ${Math.round(totalKwh).toLocaleString()} kWh. Select a building to see its brightness on the physical model.`,
  },

  ca: {
    // Landing
    landing_title: 'XARXA ENERGÈTICA',
    landing_subtitle: 'Rastreja el cost invisible de la IA',
    landing_desc: 'Cada consulta a la IA desencadena una cadena d\'energia, aigua i emissions per tot el planeta. Agafa la tauleta i segueix el fil.',
    btn_start: 'INICIAR',

    // Onboarding
    onboard_purpose: 'Descobreix l\'energia oculta, l\'aigua i la petjada de carboni darrere de cada consulta d\'IA que fas.',
    btn_learn_how: 'APRÈN COM FER-HO',
    btn_next: 'SEGÜENT',
    btn_begin: 'COMENÇAR EXHIBICIÓ',
    onboard_step1_title: 'Tria ciutat i tasca IA',
    onboard_step1_desc: 'Escull la teva ubicació i l\'operació d\'IA a simular.',
    onboard_step2_title: 'Escull centre de dades',
    onboard_step2_desc: 'Cada servidor té fonts d\'energia i costos climàtics diferents.',
    onboard_step3_title: 'Il·lumina la maqueta',
    onboard_step3_desc: 'La maqueta física s\'il·lumina segons el consum de la teva ciutat.',
    onboard_step4_title: 'Mira la pantalla gran',
    onboard_step4_desc: 'Observa com l\'electricitat, l\'aigua i el CO₂ flueixen pel planeta.',

    // Body Scale
    step1_tag: 'PAS 1',
    step1_title: 'ESCALA CORPORAL',
    step1_desc: 'La teva consulta, el teu dispositiu, la teva energia',
    label_city: 'SELECCIONA CIUTAT',
    label_workload: 'SELECCIONA OPERACIÓ IA',
    label_datacenter: 'SELECCIONA CENTRE DE DADES',
    btn_consumption: 'CALCULAR ENERGIA',

    // Body Result
    step1_result_tag: 'PAS 1 — RESULTAT',
    step1_result_desc: 'Què costa la teva consulta?',
    session_energy_label: 'ENERGIA DE LA SESSIÓ',
    kwh_unit: 'kWh utilitzats',
    btn_calc_info: 'Com es calcula?',
    btn_back: '← Enrere',
    btn_to_city: 'SIMULAR A ESCALA CIUTAT →',

    // City Scale
    step2_tag: 'PAS 2',
    step2_title: 'ESCALA CIUTAT',
    step2_desc: 'Escala als usuaris d\'IA de la teva ciutat…',
    city_stat_label: 'kWh energia total',
    btn_connect_arduino: 'CONNECTAR ARDUINO',
    arduino_hint: 'Selecciona un tipus d\'edifici i il·lumina la maqueta',
    btn_simulate: 'IL·LUMINAR MAQUETA',
    btn_restart: 'REINICIAR',
    btn_to_planetary: 'TRAÇAR FLUX ENERGÈTIC →',

    // Planetary Scale
    step3_tag: 'PAS 3',
    step3_title: 'ESCALA PLANETÀRIA',
    step3_desc: 'Mira la pantalla',
    planetary_desc: 'La simulació del flux energètic es mostra a la pantalla gran. Observa com l\'impacte de la teva consulta es propaga pel planeta — xarxes elèctriques, fonts d\'aigua, dispersió de CO₂ i cadenes de subministrament de materials.',
    planetary_hint: 'El globus de la pantalla gran mostra el teu flux energètic en temps real',
    btn_create_scenario: 'CREAR ESCENARI',
    btn_start_over: 'TORNAR A COMENÇAR',

    // Scenario
    step4_tag: 'PAS 4',
    step4_title: 'REDISSENYA LA TEVA CIUTAT',
    step4_desc: 'I si poguessis canviar la infraestructura?',
    scenario_intro: 'Afegeix components urbans a la teva ciutat i observa com canvien el flux energètic, l\'ús d\'aigua i les emissions de carboni de la teva consulta a la IA.',
    scenario_impact: 'IMPACTE DE L\'ESCENARI',
    btn_apply_scenario: 'APLICAR ESCENARI AL GLOBUS',

    // Screen side panel
    sp_eyebrow: 'UNA OPERACIÓ D\'IA',
    sp_context: 'Recursos utilitzats cada cop que una persona executa aquesta tasca d\'IA',
    sp_electricity: 'Electricitat',
    sp_water: 'Aigua',
    sp_water_unit: 'litres utilitzats',
    sp_co2: 'Emissions de CO₂',
    sp_co2_unit: 'grams de CO₂',
    sp_distance: 'Distància',
    sp_distance_unit: 'quilòmetres recorreguts',
    sp_kwh_unit: 'quilowatts-hora',

    // Screen idle
    idle_title: 'XARXA ENERGÈTICA',
    idle_subtitle: 'Esperant entrada de la tauleta…',
    idle_desc: 'Agafa la tauleta per rastrejar la infraestructura invisible de la IA',

    // Screen legend
    legend_electricity: 'Electricitat',
    legend_water: 'Aigua',
    legend_co2: 'Dispersió CO₂',
    legend_materials: 'Materials',

    // Comparison
    comparison_title: 'COMPARACIÓ D\'ESCENARIS',
    comparison_subtitle: 'Les teves intervencions urbanes han canviat el flux energètic',
    comparison_current: 'ACTUAL',
    comparison_scenario: 'ESCENARI',

    // Planetary stats
    stat_kwh: 'kWh utilitzats',
    stat_water: 'litres d\'aigua',
    stat_co2: 'gCO₂ emesos',
    stat_distance: 'km desplaçats',

    // Narratives
    narrative_standard: (data) =>
      `La teva consulta ha viatjat ${data.distanceKm.toLocaleString()} km fins a un servidor a ${data.datacenterLocation}. L'electricitat prové d'una xarxa ${Math.round(data.fossilPercent)}% fòssil. ${data.waterLiters > 0 ? `S'han utilitzat ${data.waterLiters.toFixed(1)} litres d'aigua per a la refrigeració.` : 'S\'ha utilitzat refrigeració per aigua de mar.'} S'han alliberat ${data.co2Grams.toFixed(0)}g de CO₂ — es dispersarà cap a ${data.emissionsDrift.direction} en direcció a ${data.emissionsDrift.destinations[0].name}.`,

    // City scale dynamic text
    city_desc_template: (activeUsers, cityName, workloadName, totalKwh) =>
      `Si ${activeUsers.toLocaleString()} persones a ${cityName} executessin una sessió de ${workloadName}, utilitzarien ${Math.round(totalKwh).toLocaleString()} kWh. Selecciona un edifici per veure la seva brillantor a la maqueta.`,
  },

  es: {
    // Landing
    landing_title: 'RED ENERGÉTICA',
    landing_subtitle: 'Rastrea el coste invisible de la IA',
    landing_desc: 'Cada consulta a la IA desencadena una cadena de energía, agua y emisiones por todo el planeta. Toma la tableta y sigue el hilo.',
    btn_start: 'INICIAR',

    // Onboarding
    onboard_purpose: 'Descubre la energía oculta, el agua y la huella de carbono detrás de cada consulta de IA que haces.',
    btn_learn_how: 'APRENDE CÓMO HACERLO',
    btn_next: 'SIGUIENTE',
    btn_begin: 'COMENZAR EXHIBICIÓN',
    onboard_step1_title: 'Elige ciudad y tarea IA',
    onboard_step1_desc: 'Escoge tu ubicación y la operación de IA a simular.',
    onboard_step2_title: 'Escoge centro de datos',
    onboard_step2_desc: 'Cada servidor tiene fuentes de energía y costes climáticos diferentes.',
    onboard_step3_title: 'Ilumina la maqueta',
    onboard_step3_desc: 'La maqueta física brilla según el consumo de tu ciudad.',
    onboard_step4_title: 'Mira la pantalla grande',
    onboard_step4_desc: 'Observa cómo la electricidad, el agua y el CO₂ fluyen por el planeta.',

    // Body Scale
    step1_tag: 'PASO 1',
    step1_title: 'ESCALA CORPORAL',
    step1_desc: 'Tu consulta, tu dispositivo, tu energía',
    label_city: 'SELECCIONA CIUDAD',
    label_workload: 'SELECCIONA OPERACIÓN IA',
    label_datacenter: 'SELECCIONA CENTRO DE DATOS',
    btn_consumption: 'CALCULAR ENERGÍA',

    // Body Result
    step1_result_tag: 'PASO 1 — RESULTADO',
    step1_result_desc: '¿Qué cuesta tu consulta?',
    session_energy_label: 'ENERGÍA DE LA SESIÓN',
    kwh_unit: 'kWh utilizados',
    btn_calc_info: '¿Cómo se calcula?',
    btn_back: '← Atrás',
    btn_to_city: 'SIMULAR A ESCALA CIUDAD →',

    // City Scale
    step2_tag: 'PASO 2',
    step2_title: 'ESCALA CIUDAD',
    step2_desc: 'Escala a los usuarios de IA de tu ciudad…',
    city_stat_label: 'kWh energía total',
    btn_connect_arduino: 'CONECTAR ARDUINO',
    arduino_hint: 'Selecciona un tipo de edificio e ilumina la maqueta',
    btn_simulate: 'ILUMINAR MAQUETA',
    btn_restart: 'REINICIAR',
    btn_to_planetary: 'TRAZAR FLUJO ENERGÉTICO →',

    // Planetary Scale
    step3_tag: 'PASO 3',
    step3_title: 'ESCALA PLANETARIA',
    step3_desc: 'Mira la pantalla',
    planetary_desc: 'La simulación del flujo energético se muestra en la pantalla grande. Observa cómo el impacto de tu consulta se propaga por el planeta — redes eléctricas, fuentes de agua, dispersión de CO₂ y cadenas de suministro de materiales.',
    planetary_hint: 'El globo en la pantalla grande muestra tu flujo energético en tiempo real',
    btn_create_scenario: 'CREAR ESCENARIO',
    btn_start_over: 'VOLVER A EMPEZAR',

    // Scenario
    step4_tag: 'PASO 4',
    step4_title: 'REDISEÑA TU CIUDAD',
    step4_desc: '¿Y si pudieras cambiar la infraestructura?',
    scenario_intro: 'Añade componentes urbanos a tu ciudad y observa cómo cambian el flujo energético, el uso de agua y las emisiones de carbono de tu consulta a la IA.',
    scenario_impact: 'IMPACTO DEL ESCENARIO',
    btn_apply_scenario: 'APLICAR ESCENARIO AL GLOBO',

    // Screen side panel
    sp_eyebrow: 'UNA OPERACIÓN DE IA',
    sp_context: 'Recursos utilizados cada vez que una persona ejecuta esta tarea de IA',
    sp_electricity: 'Electricidad',
    sp_water: 'Agua',
    sp_water_unit: 'litros utilizados',
    sp_co2: 'Emisiones de CO₂',
    sp_co2_unit: 'gramos de CO₂',
    sp_distance: 'Distancia',
    sp_distance_unit: 'kilómetros recorridos',
    sp_kwh_unit: 'kilovatios-hora',

    // Screen idle
    idle_title: 'RED ENERGÉTICA',
    idle_subtitle: 'Esperando entrada de la tableta…',
    idle_desc: 'Toma la tableta para rastrear la infraestructura invisible de la IA',

    // Screen legend
    legend_electricity: 'Electricidad',
    legend_water: 'Agua',
    legend_co2: 'Dispersión CO₂',
    legend_materials: 'Materiales',

    // Comparison
    comparison_title: 'COMPARACIÓN DE ESCENARIOS',
    comparison_subtitle: 'Tus intervenciones urbanas han cambiado el flujo energético',
    comparison_current: 'ACTUAL',
    comparison_scenario: 'ESCENARIO',

    // Planetary stats
    stat_kwh: 'kWh utilizados',
    stat_water: 'litros de agua',
    stat_co2: 'gCO₂ emitidos',
    stat_distance: 'km desplazados',

    // Narratives
    narrative_standard: (data) =>
      `Tu consulta ha viajado ${data.distanceKm.toLocaleString()} km hasta un servidor en ${data.datacenterLocation}. La electricidad proviene de una red ${Math.round(data.fossilPercent)}% fósil. ${data.waterLiters > 0 ? `Se han utilizado ${data.waterLiters.toFixed(1)} litros de agua para la refrigeración.` : 'Se ha utilizado refrigeración por agua de mar.'} Se han liberado ${data.co2Grams.toFixed(0)}g de CO₂ — se dispersará hacia ${data.emissionsDrift.direction} en dirección a ${data.emissionsDrift.destinations[0].name}.`,

    // City scale dynamic text
    city_desc_template: (activeUsers, cityName, workloadName, totalKwh) =>
      `Si ${activeUsers.toLocaleString()} personas en ${cityName} ejecutaran una sesión de ${workloadName}, utilizarían ${Math.round(totalKwh).toLocaleString()} kWh. Selecciona un edificio para ver su brillo en la maqueta.`,
  }
};
