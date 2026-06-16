export const TRANSLATIONS = {
  en: {
    // Landing
    landing_title: 'ENERGY NETWORK',
    landing_subtitle: 'Trace the hidden cost of AI',
    landing_subtitles: [
      'Trace the hidden cost of AI',
      'Do you know what happens when you prompt?',
      'Every query has a footprint',
      'Your data travels farther than you think',
      'The cloud is not invisible',
    ],
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
    step1_select_title: 'CITY & AI TASK SELECTION',
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
    btn_to_city: 'LET\'S MOVE TO CITY SCALE →',

    // City Scale
    step2_tag: 'STEP 2',
    step2_title: 'CITY SCALE',
    step2_desc: 'Scale up to your city\'s AI users…',
    city_stat_label: 'kWh total energy',
    s2_ai_users_in: 'AI USERS IN',
    s2_total: 'TOTAL',
    btn_pick_card: 'PICK ONE CARD TO LIGHT UP',
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

    // ── Dynamically injected UI strings ──
    calc_title: 'How is this calculated?',
    single_op_label: 'ONE OPERATION COSTS:',
    neighborhood_multiply: (aiUsers, cityName) => `NOW MULTIPLY BY ${aiUsers.toLocaleString()} AI USERS IN ${cityName}:`,
    building_cards_header: 'THIS ENERGY COULD POWER:',
    combo_primary: 'COMBINATION A',
    combo_secondary: 'COMBINATION B',
    combo_running: 'ALL RUNNING TOGETHER',
    led_off: 'LED OFF',
    led_connected: '✓ CONNECTED',
    led_connect: '🔌 CONNECT',
    led_level: (level) => `LED ${level}/255`,
    scale_one_person: '1 PERSON',
    scale_people: (n) => `${n.toLocaleString()} PEOPLE`,
    delta_energy: 'Energy',
    delta_water_label: 'Water',
    delta_co2_label: 'CO₂',
    delta_distance_label: 'Distance',
    cmp_unit_liters: 'liters',

    // Step-1 AI operation card names (uppercase to match design)
    op_prompt: 'CHAT WITH AI',
    op_image: 'GENERATE IMAGE',
    op_translate: 'REAL-TIME TRANSLATION',
    op_video: 'GENERATE VIDEO',
    op_pdf: 'SUMMARIZE A PDF',
    op_voice: 'CLONE A VOICE',
    op_background: 'REMOVE BACKGROUND',
    op_code: 'CODE WITH AI',

    // Body-result injected text
    intro_energy_text: (kwh, opName) => `THE ENERGY USED WITH YOUR <br> ${opName} OPERATION <br> IS ${kwh} KWH`,
    insight_power: (labelUpper, durationStr, opName) => `JUST ONE "${opName}" COULD POWER A ${labelUpper} FOR ${durationStr}`,
    insight_tiny: (labelUpper, opName) => `THIS "${opName}" IS A TINY FRACTION OF 1 ${labelUpper}`,

    // City-scale injected text
    city_desc_big: (aiUsers, cityName, workloadUpper) => `IF ALL ${aiUsers.toLocaleString()} AI USERS IN ${cityName} EACH DO 1 "${workloadUpper}" — THIS IS THE TOTAL ENERGY USED.`,
    city_transition_text1: (cityName, workloadName, neighborhoodKwh, aiUsers) =>
      `${cityName} has ${aiUsers.toLocaleString()} estimated AI users\nIf all of them do 1 "${workloadName}"\nthey would spend ${neighborhoodKwh} kWh`,
    city_transition_co2: (minDest, minCO2, maxDest, maxCO2) =>
      `But CO₂ depends on where it's processed\nThe least emissions come from ${minDest}: ${minCO2} kg\nWhile ${maxDest} would produce the most: ${maxCO2} kg`,
    co2_headline: (cityName, opName) => `When ${cityName} users do "${opName}", CO₂ depends on where it's processed`,
    co2_least: (dest, kg) => `The least emissions come from ${dest}: ${kg} kg`,
    co2_most: (dest, kg) => `While ${dest} would produce the most: ${kg} kg`,
    city_transition_text2: 'Let\'s see what we could do with that energy',
    transition_text: (workloadName, cityName) =>
      `Now you will see how much this one "${workloadName}" costs from ${cityName}`,

    // Duration unit words (used by formatDuration & insight)
    dur_day: 'DAY', dur_days: 'DAYS', dur_hour: 'HOUR', dur_hours: 'HOURS',
    dur_min: 'MIN', dur_minute: 'MINUTE', dur_minutes: 'MINUTES',
    dur_second: 'SECOND', dur_seconds: 'SECONDS',
    dur_less_than_min: 'LESS THAN 1 MINUTE',

    // Calc breakdown
    calc_step1_label: 'STEP 1 — BASE ENERGY (1 OPERATION)',
    calc_step2_label: 'STEP 2 — DATACENTER OVERHEAD (PUE)',
    calc_step3_label: 'STEP 3 — CLIMATE HEAT PENALTY',
    calc_step4_label: 'STEP 4 — TIME OF DAY',
    calc_total_label: 'TOTAL FOR 1 OPERATION',
    calc_pue_note: (dcUpper) => `COOLING, NETWORKING, AND INFRASTRUCTURE AT ${dcUpper}`,
    calc_heat_note: 'HOT CLIMATES NEED MORE COOLING ENERGY',

    // Model-derived name/description maps (keyed by id / English label)
    workload_names: {
      prompt: 'Chat with AI', image: 'Generate Image',
      translate: 'Real-Time Translation', video: 'Generate Video',
      pdf: 'Summarize a PDF', voice: 'Clone a Voice',
      background: 'Remove Background', code: 'Code with AI',
    },
    building_names: {
      residential: 'Residential Buildings', hospital: 'Hospital', school: 'School',
      stadium: 'Stadium', airport: 'Airport', port: 'Port', factory: 'Factory',
      officeTower: 'Office Tower',
    },
    scenario_names: {
      localDatacenter: 'Local Data Center', solarFarm: 'Solar Farm', windFarm: 'Wind Farm',
      nuclearPlant: 'Nuclear Power Station', urbanPark: 'Urban Forest / Park',
      coolingLake: 'Cooling Lake / Reservoir',
    },
    scenario_descs: {
      localDatacenter: 'Build a data center in your city — shorter data path, but local heat & water use',
      solarFarm: 'Add a large solar installation — reduces fossil dependency during daylight',
      windFarm: 'Offshore or onshore wind turbines — clean energy day and night',
      nuclearPlant: 'High-capacity baseload clean energy — nearly zero carbon, but long construction',
      urbanPark: 'Green space acts as carbon sink — absorbs CO₂ but doesn\'t reduce energy use',
      coolingLake: 'Natural water body for data center cooling — reduces freshwater depletion',
    },
    equiv_labels: {
      'LED bulb for 1 hour': 'LED bulb',
      'smartphone full charge': 'smartphone charge',
      'laptop for 1 hour': 'laptop',
      'electric kettle boil': 'electric kettle',
      'washing machine cycle': 'washing machine',
      'EV driven 1 km': 'EV per km',
      'AC unit for 1 hour': 'AC unit',
      'hot shower (5 min)': 'hot shower',
    },
    apartment_labels: {
      barcelona: 'Barcelona apartment', riyadh: 'Riyadh apartment',
      singapore: 'Singapore apartment', lagos: 'Lagos apartment',
      chicago: 'Chicago apartment', saopaulo: 'São Paulo apartment',
      default: 'typical apartment',
    },
  },

  ca: {
    // Landing
    landing_title: 'XARXA ENERGÈTICA',
    landing_subtitle: 'Rastreja el cost ocult de la IA',
    landing_subtitles: [
      'Rastreja el cost ocult de la IA',
      'Saps què passa quan fas una consulta?',
      'Cada consulta té una petjada',
      'Les teves dades viatgen més lluny del que creus',
      'El núvol no és invisible',
    ],
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
    step1_select_title: 'SELECCIÓ DE CIUTAT I TASCA IA',
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
    btn_to_city: 'ANEM A L\'ESCALA CIUTAT →',

    // City Scale
    step2_tag: 'PAS 2',
    step2_title: 'ESCALA CIUTAT',
    step2_desc: 'Escala als usuaris d\'IA de la teva ciutat…',
    city_stat_label: 'kWh energia total',
    s2_ai_users_in: 'USUARIS D\'IA A',
    s2_total: 'TOTAL',
    btn_pick_card: 'TRIA UNA TARGETA PER IL·LUMINAR',
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

    // ── Dynamically injected UI strings ──
    calc_title: 'Com es calcula?',
    single_op_label: 'UNA OPERACIÓ COSTA:',
    neighborhood_multiply: (aiUsers, cityName) => `ARA MULTIPLICA PER ${aiUsers.toLocaleString()} USUARIS D'IA A ${cityName}:`,
    building_cards_header: 'AQUESTA ENERGIA PODRIA ALIMENTAR:',
    combo_primary: 'COMBINACIÓ A',
    combo_secondary: 'COMBINACIÓ B',
    combo_running: 'TOTES FUNCIONANT ALHORA',
    led_off: 'LED APAGAT',
    led_connected: '✓ CONNECTAT',
    led_connect: '🔌 CONNECTAR',
    led_level: (level) => `LED ${level}/255`,
    scale_one_person: '1 PERSONA',
    scale_people: (n) => `${n.toLocaleString()} PERSONES`,
    delta_energy: 'Energia',
    delta_water_label: 'Aigua',
    delta_co2_label: 'CO₂',
    delta_distance_label: 'Distància',
    cmp_unit_liters: 'litres',

    // Step-1 AI operation card names (uppercase to match design)
    op_prompt: 'XATEJA AMB IA',
    op_image: 'GENERA IMATGE',
    op_translate: 'TRADUCCIÓ EN TEMPS REAL',
    op_video: 'GENERA VÍDEO',
    op_pdf: 'RESUMEIX UN PDF',
    op_voice: 'CLONA UNA VEU',
    op_background: 'ELIMINA EL FONS',
    op_code: 'PROGRAMA AMB IA',

    // Body-result injected text
    intro_energy_text: (kwh, opName) => `L'ENERGIA UTILITZADA EN LA TEVA <br> OPERACIÓ ${opName} <br> ÉS ${kwh} KWH`,
    insight_power: (labelUpper, durationStr, opName) => `AQUESTA "${opName}" PODRIA ALIMENTAR UN ${labelUpper} DURANT ${durationStr}`,
    insight_tiny: (labelUpper, opName) => `AQUESTA "${opName}" ÉS UNA FRACCIÓ MÍNIMA D'1 ${labelUpper}`,

    // City-scale injected text
    city_desc_big: (aiUsers, cityName, workloadUpper) => `SI ELS ${aiUsers.toLocaleString()} USUARIS D'IA A ${cityName} FESSIN 1 "${workloadUpper}" — AQUESTA ÉS L'ENERGIA TOTAL UTILITZADA.`,
    city_transition_text1: (cityName, workloadName, neighborhoodKwh, aiUsers) =>
      `${cityName} té ${aiUsers.toLocaleString()} usuaris d'IA estimats\nSi tots fessin 1 "${workloadName}"\ngastarien ${neighborhoodKwh} kWh`,
    city_transition_co2: (minDest, minCO2, maxDest, maxCO2) =>
      `Però el CO₂ depèn d'on es processi\nMenys emissions vénen de ${minDest}: ${minCO2} kg\nMentre que ${maxDest} en produiria més: ${maxCO2} kg`,
    co2_headline: (cityName, opName) => `Quan els usuaris de ${cityName} fan "${opName}", el CO₂ depèn d'on es processi`,
    co2_least: (dest, kg) => `Menys emissions vénen de ${dest}: ${kg} kg`,
    co2_most: (dest, kg) => `Mentre que ${dest} en produiria més: ${kg} kg`,
    city_transition_text2: 'Vegem què podríem fer amb aquesta energia',
    transition_text: (workloadName, cityName) =>
      `Ara veuràs quant costa aquesta "${workloadName}" des de ${cityName}`,

    // Duration unit words (used by formatDuration & insight)
    dur_day: 'DIA', dur_days: 'DIES', dur_hour: 'HORA', dur_hours: 'HORES',
    dur_min: 'MIN', dur_minute: 'MINUT', dur_minutes: 'MINUTS',
    dur_second: 'SEGON', dur_seconds: 'SEGONS',
    dur_less_than_min: 'MENYS D\'1 MINUT',

    // Calc breakdown
    calc_step1_label: 'PAS 1 — ENERGIA BASE (1 OPERACIÓ)',
    calc_step2_label: 'PAS 2 — SOBRECÀRREGA DEL CENTRE DE DADES (PUE)',
    calc_step3_label: 'PAS 3 — PENALITZACIÓ PER CALOR DEL CLIMA',
    calc_step4_label: 'PAS 4 — HORA DEL DIA',
    calc_total_label: 'TOTAL PER 1 OPERACIÓ',
    calc_pue_note: (dcUpper) => `REFRIGERACIÓ, XARXA I INFRAESTRUCTURA A ${dcUpper}`,
    calc_heat_note: 'ELS CLIMES CALOROSOS NECESSITEN MÉS ENERGIA DE REFRIGERACIÓ',

    // Model-derived name/description maps (keyed by id / English label)
    workload_names: {
      prompt: 'Xateja amb IA', image: 'Genera Imatge',
      translate: 'Traducció en Temps Real', video: 'Genera Vídeo',
      pdf: 'Resumeix un PDF', voice: 'Clona una Veu',
      background: 'Elimina el Fons', code: 'Programa amb IA',
    },
    building_names: {
      residential: 'Edificis Residencials', hospital: 'Hospital', school: 'Escola',
      stadium: 'Estadi', airport: 'Aeroport', port: 'Port', factory: 'Fàbrica',
      officeTower: 'Torre d\'Oficines',
    },
    scenario_names: {
      localDatacenter: 'Centre de Dades Local', solarFarm: 'Parc Solar', windFarm: 'Parc Eòlic',
      nuclearPlant: 'Central Nuclear', urbanPark: 'Bosc Urbà / Parc',
      coolingLake: 'Llac de Refrigeració / Embassament',
    },
    scenario_descs: {
      localDatacenter: 'Construeix un centre de dades a la teva ciutat — camí de dades més curt, però calor i ús d\'aigua locals',
      solarFarm: 'Afegeix una gran instal·lació solar — redueix la dependència fòssil durant el dia',
      windFarm: 'Turbines eòliques marines o terrestres — energia neta dia i nit',
      nuclearPlant: 'Energia neta de base d\'alta capacitat — gairebé zero carboni, però construcció llarga',
      urbanPark: 'L\'espai verd actua com a embornal de carboni — absorbeix CO₂ però no redueix el consum',
      coolingLake: 'Massa d\'aigua natural per refrigerar el centre de dades — redueix l\'esgotament d\'aigua dolça',
    },
    equiv_labels: {
      'LED bulb for 1 hour': 'bombeta LED',
      'smartphone full charge': 'càrrega mòbil',
      'laptop for 1 hour': 'portàtil',
      'electric kettle boil': 'bullidor elèctric',
      'washing machine cycle': 'rentadora',
      'EV driven 1 km': 'cotxe elèctric per km',
      'AC unit for 1 hour': 'aire condicionat',
      'hot shower (5 min)': 'dutxa calenta',
    },
    apartment_labels: {
      barcelona: 'apartament de Barcelona', riyadh: 'apartament de Riyadh',
      singapore: 'apartament de Singapur', lagos: 'apartament de Lagos',
      chicago: 'apartament de Chicago', saopaulo: 'apartament de São Paulo',
      default: 'apartament típic',
    },
  },

  es: {
    // Landing
    landing_title: 'RED ENERGÉTICA',
    landing_subtitle: 'Rastrea el coste oculto de la IA',
    landing_subtitles: [
      'Rastrea el coste oculto de la IA',
      '¿Sabes qué pasa cuando haces una consulta?',
      'Cada consulta tiene una huella',
      'Tus datos viajan más lejos de lo que crees',
      'La nube no es invisible',
    ],
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
    step1_select_title: 'SELECCIÓN DE CIUDAD Y TAREA IA',
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
    btn_to_city: 'VAMOS A LA ESCALA CIUDAD →',

    // City Scale
    step2_tag: 'PASO 2',
    step2_title: 'ESCALA CIUDAD',
    step2_desc: 'Escala a los usuarios de IA de tu ciudad…',
    city_stat_label: 'kWh energía total',
    s2_ai_users_in: 'USUARIOS DE IA EN',
    s2_total: 'TOTAL',
    btn_pick_card: 'ELIGE UNA TARJETA PARA ILUMINAR',
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

    // ── Dynamically injected UI strings ──
    calc_title: '¿Cómo se calcula?',
    single_op_label: 'UNA OPERACIÓN CUESTA:',
    neighborhood_multiply: (aiUsers, cityName) => `AHORA MULTIPLICA POR ${aiUsers.toLocaleString()} USUARIOS DE IA EN ${cityName}:`,
    building_cards_header: 'ESTA ENERGÍA PODRÍA ALIMENTAR:',
    combo_primary: 'COMBINACIÓN A',
    combo_secondary: 'COMBINACIÓN B',
    combo_running: 'TODAS FUNCIONANDO A LA VEZ',
    led_off: 'LED APAGADO',
    led_connected: '✓ CONECTADO',
    led_connect: '🔌 CONECTAR',
    led_level: (level) => `LED ${level}/255`,
    scale_one_person: '1 PERSONA',
    scale_people: (n) => `${n.toLocaleString()} PERSONAS`,
    delta_energy: 'Energía',
    delta_water_label: 'Agua',
    delta_co2_label: 'CO₂',
    delta_distance_label: 'Distancia',
    cmp_unit_liters: 'litros',

    // Step-1 AI operation card names (uppercase to match design)
    op_prompt: 'CHATEA CON IA',
    op_image: 'GENERAR IMAGEN',
    op_translate: 'TRADUCCIÓN EN TIEMPO REAL',
    op_video: 'GENERAR VÍDEO',
    op_pdf: 'RESUMIR UN PDF',
    op_voice: 'CLONAR UNA VOZ',
    op_background: 'ELIMINAR EL FONDO',
    op_code: 'PROGRAMAR CON IA',

    // Body-result injected text
    intro_energy_text: (kwh, opName) => `LA ENERGÍA UTILIZADA EN TU <br> OPERACIÓN ${opName} <br> ES ${kwh} KWH`,
    insight_power: (labelUpper, durationStr, opName) => `ESTA "${opName}" PODRÍA ALIMENTAR UN ${labelUpper} DURANTE ${durationStr}`,
    insight_tiny: (labelUpper, opName) => `ESTA "${opName}" ES UNA FRACCIÓN MÍNIMA DE 1 ${labelUpper}`,

    // City-scale injected text
    city_desc_big: (aiUsers, cityName, workloadUpper) => `SI LOS ${aiUsers.toLocaleString()} USUARIOS DE IA EN ${cityName} HICIERAN 1 "${workloadUpper}" — ESTA ES LA ENERGÍA TOTAL UTILIZADA.`,
    city_transition_text1: (cityName, workloadName, neighborhoodKwh, aiUsers, minDest, minCO2, maxDest, maxCO2) =>
      `${cityName} tiene ${aiUsers.toLocaleString()} usuarios de IA estimados\nSi todos hicieran 1 "${workloadName}"\ngastarían ${neighborhoodKwh} kWh`,
    city_transition_co2: (minDest, minCO2, maxDest, maxCO2) =>
      `Pero el CO₂ depende de dónde se procese\nMenos emisiones vienen de ${minDest}: ${minCO2} kg\nMientras que ${maxDest} produciría más: ${maxCO2} kg`,
    co2_headline: (cityName, opName) => `Cuando los usuarios de ${cityName} hacen "${opName}", el CO₂ depende de dónde se procese`,
    co2_least: (dest, kg) => `Menos emisiones vienen de ${dest}: ${kg} kg`,
    co2_most: (dest, kg) => `Mientras que ${dest} produciría más: ${kg} kg`,
    city_transition_text2: 'Veamos qué podríamos hacer con esa energía',
    transition_text: (workloadName, cityName) =>
      `Ahora verás cuánto cuesta esta "${workloadName}" desde ${cityName}`,

    // Duration unit words (used by formatDuration & insight)
    dur_day: 'DÍA', dur_days: 'DÍAS', dur_hour: 'HORA', dur_hours: 'HORAS',
    dur_min: 'MIN', dur_minute: 'MINUTO', dur_minutes: 'MINUTOS',
    dur_second: 'SEGUNDO', dur_seconds: 'SEGUNDOS',
    dur_less_than_min: 'MENOS DE 1 MINUTO',

    // Calc breakdown
    calc_step1_label: 'PASO 1 — ENERGÍA BASE (1 OPERACIÓN)',
    calc_step2_label: 'PASO 2 — SOBRECARGA DEL CENTRO DE DATOS (PUE)',
    calc_step3_label: 'PASO 3 — PENALIZACIÓN POR CALOR DEL CLIMA',
    calc_step4_label: 'PASO 4 — HORA DEL DÍA',
    calc_total_label: 'TOTAL POR 1 OPERACIÓN',
    calc_pue_note: (dcUpper) => `REFRIGERACIÓN, RED E INFRAESTRUCTURA EN ${dcUpper}`,
    calc_heat_note: 'LOS CLIMAS CÁLIDOS NECESITAN MÁS ENERGÍA DE REFRIGERACIÓN',

    // Model-derived name/description maps (keyed by id / English label)
    workload_names: {
      prompt: 'Chatea con IA', image: 'Generar Imagen',
      translate: 'Traducción en Tiempo Real', video: 'Generar Vídeo',
      pdf: 'Resumir un PDF', voice: 'Clonar una Voz',
      background: 'Eliminar el Fondo', code: 'Programar con IA',
    },
    building_names: {
      residential: 'Edificios Residenciales', hospital: 'Hospital', school: 'Escuela',
      stadium: 'Estadio', airport: 'Aeropuerto', port: 'Puerto', factory: 'Fábrica',
      officeTower: 'Torre de Oficinas',
    },
    scenario_names: {
      localDatacenter: 'Centro de Datos Local', solarFarm: 'Parque Solar', windFarm: 'Parque Eólico',
      nuclearPlant: 'Central Nuclear', urbanPark: 'Bosque Urbano / Parque',
      coolingLake: 'Lago de Refrigeración / Embalse',
    },
    scenario_descs: {
      localDatacenter: 'Construye un centro de datos en tu ciudad — ruta de datos más corta, pero calor y uso de agua locales',
      solarFarm: 'Añade una gran instalación solar — reduce la dependencia fósil durante el día',
      windFarm: 'Turbinas eólicas marinas o terrestres — energía limpia día y noche',
      nuclearPlant: 'Energía limpia de base de alta capacidad — casi cero carbono, pero construcción larga',
      urbanPark: 'El espacio verde actúa como sumidero de carbono — absorbe CO₂ pero no reduce el consumo',
      coolingLake: 'Masa de agua natural para refrigerar el centro de datos — reduce el agotamiento de agua dulce',
    },
    equiv_labels: {
      'LED bulb for 1 hour': 'bombilla LED',
      'smartphone full charge': 'carga móvil',
      'laptop for 1 hour': 'portátil',
      'electric kettle boil': 'hervidor eléctrico',
      'washing machine cycle': 'lavadora',
      'EV driven 1 km': 'coche eléctrico por km',
      'AC unit for 1 hour': 'aire acondicionado',
      'hot shower (5 min)': 'ducha caliente',
    },
    apartment_labels: {
      barcelona: 'apartamento de Barcelona', riyadh: 'apartamento de Riyadh',
      singapore: 'apartamento de Singapur', lagos: 'apartamento de Lagos',
      chicago: 'apartamento de Chicago', saopaulo: 'apartamento de São Paulo',
      default: 'apartamento típico',
    },
  }
};
