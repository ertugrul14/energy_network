#!/usr/bin/env python3
"""
Generate the complete exhibit lookup JSON.
Structure: city -> operations -> {label, show[], destinations -> {totals + buildingHours(all 8)}}

All per-destination PER-USER values come from the research PDF "total energy per city" tables
(electricity kWh, CO2 g, water mL per single operation). City totals = per-user * aiUsers.
Building-hours = city_total / building_hourly_rate (city-specific grid for co2/water).
"""
import json, collections

# ---------------------------------------------------------------------------
# 1. POPULATIONS (AI users per city)
# ---------------------------------------------------------------------------
AI_USERS = {
    "Barcelona": 568000,
    "Riyadh":    2837000,
    "Singapore": 3670000,
    "Lagos":     1955000,
    "Chicago":   1246000,
    "SaoPaulo":  3794000,
}

CITY_LABEL = {
    "Barcelona":"Barcelona","Riyadh":"Riyadh","Singapore":"Singapore",
    "Lagos":"Lagos","Chicago":"Chicago","SaoPaulo":"Sao Paulo",
}

# ---------------------------------------------------------------------------
# 2. BUILDING HOURLY ELECTRICITY (kWh/h) - grid independent
#    and per-CITY grid factors (co2 g/kWh, water L/kWh)
# ---------------------------------------------------------------------------
BUILDING_ELEC = {   # kWh per hour
    "stadium":     5750.0,
    "officeTowers":1923.0,   # 2 towers combined
    "airport":      456.6,
    "factory":      250.0,
    "port":         228.3,
    "school":       100.0,
    "hospital":      68.5,
    "residential":    7.2,   # 6 houses combined
}

CITY_GRID = {   # co2 g/kWh, water L/kWh  (for buildings, per city home grid)
    "Barcelona": (170, 1.6),
    "Riyadh":    (600, 2.6),
    "Singapore": (410, 2.2),
    "Lagos":     (380, 1.4),
    "Chicago":   (300, 1.7),
    "SaoPaulo":  (90,  1.0),
}

# Building hourly co2(kg/h) & water(L/h) per city
def building_rates(city):
    co2f, watf = CITY_GRID[city]
    rates = {}
    for b, e in BUILDING_ELEC.items():
        rates[b] = {
            "elec":  e,
            "co2":   e * co2f / 1000.0,  # kg/h
            "water": e * watf,           # L/h
        }
    return rates

# ---------------------------------------------------------------------------
# 3. OPERATION metadata + rotating building "show" sets
#    (rotation chosen so all 8 buildings appear across the 8 operations,
#     and each set's scale fits the operation's magnitude)
# ---------------------------------------------------------------------------
# Each operation has TWO complementary building groups that together cover all 8
# typologies. primary = lighter/headline set; secondary = the remaining buildings.
OPERATIONS = {
    "prompt":    {"label":"Chat with AI (ChatGPT)",
                  "primary":["hospital","school","residential"],
                  "secondary":["factory","airport","officeTowers","port","stadium"]},
    "translate": {"label":"Real-time Translation (Google Translate)",
                  "primary":["airport","officeTowers","factory"],
                  "secondary":["stadium","port","school","hospital","residential"]},
    "pdf":       {"label":"Summarise PDF (Claude)",
                  "primary":["hospital","port","factory"],
                  "secondary":["airport","officeTowers","stadium","school","residential"]},
    "background":{"label":"Remove Background (Adobe Express)",
                  "primary":["school","residential"],
                  "secondary":["hospital","port","factory","airport","officeTowers","stadium"]},
    "image":     {"label":"Generate Image (Midjourney)",
                  "primary":["airport","port","school"],
                  "secondary":["hospital","residential","factory","officeTowers","stadium"]},
    "video":     {"label":"Generate Video (Sora)",
                  "primary":["stadium","officeTowers","airport"],
                  "secondary":["factory","port","school","hospital","residential"]},
    "voice":     {"label":"Clone Voice (ElevenLabs)",
                  "primary":["hospital","port","residential"],
                  "secondary":["school","factory","airport","officeTowers","stadium"]},
    "code":      {"label":"Code with AI (GitHub Copilot)",
                  "primary":["factory","school","hospital"],
                  "secondary":["residential","port","airport","officeTowers","stadium"]},
}

# ---------------------------------------------------------------------------
# 4. PER-USER per-destination values  (electricity kWh, co2 g, water mL)
#    Transcribed from research PDF "total energy per city" section.
#    Keyed: PERUSER[city][op] = { destination: (elec_kWh, co2_g, water_mL) }
# ---------------------------------------------------------------------------
PERUSER = collections.defaultdict(dict)

# ---- BARCELONA ----
PERUSER["Barcelona"]["prompt"] = {
 "Virginia":(0.001335,0.40,0.44),"Iowa":(0.001301,0.18,0.35),"Illinois":(0.001324,0.30,0.38),
 "Texas":(0.001359,0.49,0.49),"California":(0.001359,0.16,0.47),"Arizona":(0.001382,0.47,0.58),
 "Quebec City":(0.001312,0.04,0.28),"Toronto":(0.001324,0.15,0.34),"Sao Paulo":(0.001382,0.13,0.48),
 "Stockholm":(0.001324,0.03,0.24),"Paris":(0.001347,0.03,0.40),"Frankfurt":(0.001347,0.47,0.40),
 "Milan":(0.001358,0.39,0.43),"Netherlands":(0.001335,0.36,0.40),"Oslo":(0.001324,0.04,0.24),
 "Zurich":(0.001335,0.05,0.36),"Madrid":(0.001358,0.20,0.45),"London":(0.001335,0.25,0.38),
 "Tokyo":(0.001474,0.71,0.53),"Osaka":(0.001474,0.71,0.53),"Seoul":(0.001462,0.61,0.48),
 "New South Wales":(0.001440,0.86,0.48),"Pune":(0.001519,0.96,0.59),"Chennai":(0.001531,0.96,0.62),
 "Mumbai":(0.001531,0.96,0.62),"Dubai":(0.001542,0.65,0.74),"Johannesburg":(0.001381,0.94,0.39),
}
PERUSER["Barcelona"]["translate"] = {
 "Central Ohio":(0.0908,37.21,25.87),"Council Bluffs (Iowa)":(0.0936,12.64,25.28),
 "The Dalles (Oregon)":(0.0977,11.72,23.44),"Storey County (Nevada)":(0.0995,27.86,43.28),
 "Henderson (Nevada)":(0.0997,27.91,44.85),"Douglas County (Georgia)":(0.0927,32.44,33.37),
 "The Lowcountry (S. Carolina)":(0.0916,27.48,34.35),"Lenoir (N. Carolina)":(0.0913,27.38,30.12),
 "Jackson County (Alabama)":(0.0929,30.65,33.44),"Indiana":(0.0916,34.82,26.12),
 "Papillion (Nebraska)":(0.0938,28.13,26.72),"Omaha (Nebraska)":(0.0937,28.12,26.71),
 "Northern Virginia":(0.0895,26.85,29.54),"Montgomery County (Tenn.)":(0.0927,27.80,31.98),
 "Midlothian (Texas)":(0.0962,34.65,34.65),"Mayes County (Oklahoma)":(0.0948,36.01,32.70),
 "Dublin (Ireland)":(0.0713,20.68,18.18),"Hamina (Finland)":(0.0758,5.31,14.78),
 "Fredericia (Denmark)":(0.0720,7.92,15.12),"Eemshaven (Netherlands)":(0.0710,19.16,19.16),
 "Hanau (Germany)":(0.0700,24.51,21.01),"Singapore":(0.1054,43.22,44.28),
 "Changhua County (Taiwan)":(0.1035,50.73,40.37),"Inzai City (Japan)":(0.1037,49.77,35.77),
}
PERUSER["Barcelona"]["pdf"] = {
 "N. Virginia":(0.01268,3.80,4.18),"Ohio":(0.01257,5.15,3.58),"Oregon":(0.01225,1.47,2.94),
 "Montreal":(0.01235,0.37,2.78),"Dublin (Ireland)":(0.01221,3.54,3.11),"London (UK)":(0.01232,2.34,3.33),
 "Frankfurt (Germany)":(0.01243,4.35,3.73),"Milan (Italy)":(0.01253,3.64,3.95),
 "Zurich (Switzerland)":(0.01232,0.49,3.33),"Paris (France)":(0.01231,0.27,3.69),
 "Stockholm (Sweden)":(0.01210,0.28,2.18),"Tokyo (Japan)":(0.01292,6.20,4.46),
 "Seoul (South Korea)":(0.01292,5.43,4.26),"Melbourne (Australia)":(0.01274,6.88,4.01),
 "Jakarta (Indonesia)":(0.01315,8.55,5.53),
}
PERUSER["Barcelona"]["background"] = {
 "Dublin (serves EMEA)":(0.00324,0.94,0.83),
}
PERUSER["Barcelona"]["image"] = {
 "Central Ohio":(0.02324,9.53,6.62),"Council Bluffs (Iowa)":(0.02304,3.11,6.22),
 "The Dalles (Oregon)":(0.02262,2.72,5.43),"Storey County (Nevada)":(0.02368,6.63,10.30),
 "Henderson (Nevada)":(0.02389,6.69,10.75),"Douglas County (Georgia)":(0.02345,8.21,8.44),
 "The Lowcountry (S. Carolina)":(0.02324,6.97,8.72),"Lenoir (N. Carolina)":(0.02324,6.97,7.67),
 "Jackson County (Alabama)":(0.02387,7.88,8.60),"Indiana":(0.02324,8.83,6.62),
 "Papillion (Nebraska)":(0.02325,6.97,6.63),"Omaha (Nebraska)":(0.02325,6.97,6.63),
 "Northern Virginia":(0.02324,6.97,7.67),"Montgomery County (Tenn.)":(0.02324,6.97,8.02),
 "Midlothian (Texas)":(0.02346,8.45,8.45),"Mayes County (Oklahoma)":(0.02325,8.83,8.02),
 "Dublin (Ireland)":(0.02300,6.67,5.87),"Hamina (Finland)":(0.02301,1.61,4.49),
 "Fredericia (Denmark)":(0.02300,2.53,4.83),"Eemshaven (Netherlands)":(0.02300,6.21,6.21),
 "Hanau (Germany)":(0.02321,8.12,6.96),"Singapore":(0.02411,9.88,10.12),
 "Changhua County (Taiwan)":(0.02389,11.71,9.32),"Inzai City (Japan)":(0.02368,11.37,8.17),
}
PERUSER["Barcelona"]["video"] = {
 "Virginia":(0.3494,104.82,115.30),"Iowa":(0.3405,45.96,91.92),"Illinois":(0.3464,79.68,98.73),
 "Texas":(0.3555,127.99,127.99),"California":(0.3556,42.67,122.67),"Arizona":(0.3616,122.93,151.86),
 "Quebec City":(0.3433,10.30,72.10),"Toronto":(0.3464,38.10,88.33),"Sao Paulo":(0.3615,34.35,124.73),
 "Stockholm":(0.3461,7.96,62.31),"Paris":(0.3520,7.75,105.62),"Frankfurt":(0.3521,123.22,105.62),
 "Milan":(0.3550,102.96,111.84),"Netherlands":(0.3491,94.25,104.72),"Oslo":(0.3461,10.38,62.30),
 "Zurich":(0.3491,13.96,94.24),"Madrid":(0.3550,53.26,117.16),"London":(0.3491,66.32,99.48),
 "Tokyo":(0.3856,185.10,138.83),"Osaka":(0.3856,185.10,138.82),"Seoul":(0.3826,160.68,126.25),
 "New South Wales":(0.3770,226.22,124.42),"Pune":(0.3974,250.38,155.00),"Chennai":(0.4005,252.31,162.20),
 "Mumbai":(0.4004,252.27,162.17),"Dubai":(0.4033,169.39,193.59),"Johannesburg":(0.3615,245.81,103.02),
}
PERUSER["Barcelona"]["voice"] = {
 "Council Bluffs, Iowa":(0.00658,0.89,1.78),"Moncks Corner, S. Carolina":(0.00662,1.99,2.48),
 "Ashburn, Virginia":(0.00661,1.98,2.18),"Columbus, Ohio":(0.00661,2.71,1.89),
 "Dallas, Texas":(0.00671,2.41,2.41),"The Dalles, Oregon":(0.00650,0.78,1.56),
}
PERUSER["Barcelona"]["code"] = {
 "Virginia":(0.003077,0.92,1.02),"Iowa":(0.002997,0.40,0.81),"Illinois":(0.003050,0.70,0.87),
 "Texas":(0.003130,1.13,1.13),"California":(0.003130,0.38,1.08),"Arizona":(0.003183,1.08,1.34),
 "Quebec City":(0.003024,0.09,0.64),"Toronto":(0.003050,0.34,0.78),"Sao Paulo":(0.003183,0.30,1.10),
 "Stockholm":(0.003050,0.07,0.55),"Paris":(0.003103,0.07,0.93),"Frankfurt":(0.003103,1.09,0.93),
 "Milan":(0.003129,0.91,0.99),"Netherlands":(0.003076,0.83,0.92),"Oslo":(0.003050,0.09,0.55),
 "Zurich":(0.003076,0.12,0.83),"Madrid":(0.003129,0.47,1.03),"London":(0.003076,0.58,0.88),
 "Tokyo":(0.003395,1.63,1.22),"Osaka":(0.003395,1.63,1.22),"Seoul":(0.003369,1.41,1.11),
 "New South Wales":(0.003317,1.99,1.09),"Pune":(0.003501,2.21,1.37),"Chennai":(0.003527,2.22,1.43),
 "Mumbai":(0.003527,2.22,1.43),"Dubai":(0.003554,1.49,1.71),"Johannesburg":(0.003183,2.16,0.91),
}

# ---- RIYADH ----
PERUSER["Riyadh"]["prompt"] = {
 "Virginia":(0.001336,0.40,0.44),"Iowa":(0.001301,0.18,0.35),"Illinois":(0.001324,0.30,0.38),
 "Texas":(0.001359,0.49,0.49),"California":(0.001359,0.16,0.47),"Arizona":(0.001382,0.47,0.58),
 "Quebec City":(0.001313,0.04,0.28),"Toronto":(0.001324,0.15,0.34),"Sao Paulo":(0.001382,0.13,0.48),
 "Stockholm":(0.001324,0.03,0.24),"Paris":(0.001347,0.03,0.40),"Frankfurt":(0.001347,0.47,0.40),
 "Milan":(0.001358,0.39,0.43),"Netherlands":(0.001335,0.36,0.40),"Oslo":(0.001324,0.04,0.24),
 "Zurich":(0.001335,0.05,0.36),"Madrid":(0.001358,0.20,0.45),"London":(0.001335,0.25,0.38),
 "Tokyo":(0.001474,0.71,0.53),"Osaka":(0.001474,0.71,0.53),"Seoul":(0.001462,0.61,0.48),
 "New South Wales":(0.001439,0.86,0.48),"Pune":(0.001519,0.96,0.59),"Chennai":(0.001531,0.96,0.62),
 "Mumbai":(0.001531,0.96,0.62),"Dubai":(0.001542,0.65,0.74),"Johannesburg":(0.001381,0.94,0.39),
}
PERUSER["Riyadh"]["translate"] = {
 "Central Ohio":(0.1061,43.51,30.25),"Council Bluffs (Iowa)":(0.1082,14.61,29.22),
 "The Dalles (Oregon)":(0.1094,13.13,26.27),"Storey County (Nevada)":(0.1120,31.36,48.72),
 "Henderson (Nevada)":(0.1130,31.63,50.84),"Douglas County (Georgia)":(0.1084,37.93,39.01),
 "The Lowcountry (S. Carolina)":(0.1074,32.23,40.29),"Lenoir (N. Carolina)":(0.1069,32.08,35.29),
 "Jackson County (Alabama)":(0.1084,35.79,39.04),"Indiana":(0.1069,40.61,30.46),
 "Papillion (Nebraska)":(0.1083,32.50,30.87),"Omaha (Nebraska)":(0.1083,32.48,30.86),
 "Northern Virginia":(0.1051,31.54,34.69),"Montgomery County (Tenn.)":(0.1081,32.42,37.29),
 "Midlothian (Texas)":(0.1114,40.10,40.10),"Mayes County (Oklahoma)":(0.1098,41.71,37.87),
 "Dublin (Ireland)":(0.0854,24.77,21.78),"Hamina (Finland)":(0.0813,5.69,15.86),
 "Fredericia (Denmark)":(0.0824,9.06,17.30),"Eemshaven (Netherlands)":(0.0825,22.28,22.28),
 "Hanau (Germany)":(0.0815,28.53,24.45),"Singapore":(0.0902,36.99,37.89),
 "Changhua County (Taiwan)":(0.0928,45.46,36.18),"Inzai City (Japan)":(0.0976,46.83,33.66),
}
PERUSER["Riyadh"]["pdf"] = {
 "N. Virginia":(0.01271,3.81,4.19),"Ohio":(0.01260,5.16,3.59),"Oregon":(0.01227,1.47,2.95),
 "Montreal":(0.01237,0.37,2.78),"Dublin (Ireland)":(0.01223,3.55,3.12),"London (UK)":(0.01234,2.34,3.33),
 "Frankfurt (Germany)":(0.01245,4.36,3.73),"Milan (Italy)":(0.01255,3.64,3.95),
 "Zurich (Switzerland)":(0.01234,0.49,3.33),"Paris (France)":(0.01234,0.27,3.70),
 "Stockholm (Sweden)":(0.01212,0.28,2.18),"Tokyo (Japan)":(0.01291,6.20,4.45),
 "Seoul (South Korea)":(0.01291,5.42,4.26),"Melbourne (Australia)":(0.01271,6.87,4.00),
 "Jakarta (Indonesia)":(0.01312,8.53,5.51),
}
PERUSER["Riyadh"]["background"] = {
 "Dublin (serves EMEA)":(0.00329,0.95,0.84),
}
PERUSER["Riyadh"]["image"] = {
 "Central Ohio":(0.02327,9.54,6.63),"Council Bluffs (Iowa)":(0.02306,3.11,6.23),
 "The Dalles (Oregon)":(0.02264,2.72,5.43),"Storey County (Nevada)":(0.02370,6.64,10.31),
 "Henderson (Nevada)":(0.02391,6.69,10.76),"Douglas County (Georgia)":(0.02348,8.22,8.45),
 "The Lowcountry (S. Carolina)":(0.02327,6.98,8.73),"Lenoir (N. Carolina)":(0.02327,6.98,7.68),
 "Jackson County (Alabama)":(0.02390,7.89,8.60),"Indiana":(0.02327,8.84,6.63),
 "Papillion (Nebraska)":(0.02327,6.98,6.63),"Omaha (Nebraska)":(0.02327,6.98,6.63),
 "Northern Virginia":(0.02327,6.98,7.68),"Montgomery County (Tenn.)":(0.02327,6.98,8.03),
 "Midlothian (Texas)":(0.02349,8.46,8.46),"Mayes County (Oklahoma)":(0.02327,8.84,8.03),
 "Dublin (Ireland)":(0.02302,6.68,5.87),"Hamina (Finland)":(0.02302,1.61,4.49),
 "Fredericia (Denmark)":(0.02302,2.53,4.83),"Eemshaven (Netherlands)":(0.02302,6.22,6.22),
 "Hanau (Germany)":(0.02323,8.13,6.97),"Singapore":(0.02408,9.87,10.11),
 "Changhua County (Taiwan)":(0.02387,11.70,9.31),"Inzai City (Japan)":(0.02367,11.36,8.17),
}
PERUSER["Riyadh"]["video"] = {
 "Virginia":(0.3497,104.90,115.39),"Iowa":(0.3407,45.99,91.99),"Illinois":(0.3467,79.74,98.80),
 "Texas":(0.3558,128.08,128.08),"California":(0.3558,42.69,122.74),"Arizona":(0.3618,123.01,151.95),
 "Quebec City":(0.3436,10.31,72.16),"Toronto":(0.3466,38.13,88.39),"Sao Paulo":(0.3617,34.36,124.78),
 "Stockholm":(0.3463,7.96,62.33),"Paris":(0.3523,7.75,105.68),"Frankfurt":(0.3523,123.29,105.68),
 "Milan":(0.3552,103.02,111.90),"Netherlands":(0.3493,94.31,104.78),"Oslo":(0.3463,10.39,62.33),
 "Zurich":(0.3493,13.97,94.30),"Madrid":(0.3553,53.30,117.25),"London":(0.3493,66.37,99.55),
 "Tokyo":(0.3855,185.05,138.79),"Osaka":(0.3855,185.04,138.78),"Seoul":(0.3825,160.63,126.21),
 "New South Wales":(0.3768,226.06,124.33),"Pune":(0.3972,250.22,154.90),"Chennai":(0.4002,252.14,162.09),
 "Mumbai":(0.4002,252.11,162.07),"Dubai":(0.4031,169.28,193.47),"Johannesburg":(0.3614,245.73,102.99),
}
PERUSER["Riyadh"]["voice"] = {
 "Council Bluffs, Iowa":(0.00668,0.90,1.80),"Moncks Corner, S. Carolina":(0.00672,2.02,2.52),
 "Ashburn, Virginia":(0.00671,2.01,2.21),"Columbus, Ohio":(0.00672,2.75,1.91),
 "Dallas, Texas":(0.00681,2.45,2.45),"The Dalles, Oregon":(0.00658,0.79,1.58),
}
PERUSER["Riyadh"]["code"] = {
 "Virginia":(0.003077,0.92,1.02),"Iowa":(0.002998,0.40,0.81),"Illinois":(0.003051,0.70,0.87),
 "Texas":(0.003131,1.13,1.13),"California":(0.003131,0.38,1.08),"Arizona":(0.003184,1.08,1.34),
 "Quebec City":(0.003024,0.09,0.64),"Toronto":(0.003051,0.34,0.78),"Sao Paulo":(0.003183,0.30,1.10),
 "Stockholm":(0.003050,0.07,0.55),"Paris":(0.003103,0.07,0.93),"Frankfurt":(0.003103,1.09,0.93),
 "Milan":(0.003129,0.91,0.99),"Netherlands":(0.003077,0.83,0.92),"Oslo":(0.003050,0.09,0.55),
 "Zurich":(0.003077,0.12,0.83),"Madrid":(0.003130,0.47,1.03),"London":(0.003077,0.58,0.88),
 "Tokyo":(0.003395,1.63,1.22),"Osaka":(0.003395,1.63,1.22),"Seoul":(0.003368,1.41,1.11),
 "New South Wales":(0.003316,1.99,1.09),"Pune":(0.003500,2.21,1.37),"Chennai":(0.003527,2.22,1.43),
 "Mumbai":(0.003527,2.22,1.43),"Dubai":(0.003553,1.49,1.71),"Johannesburg":(0.003183,2.16,0.91),
}

# ---- SINGAPORE ----
PERUSER["Singapore"]["prompt"] = {
 "Virginia":(0.001336,0.40,0.44),"Iowa":(0.001301,0.18,0.35),"Illinois":(0.001324,0.30,0.38),
 "Texas":(0.001359,0.49,0.49),"California":(0.001359,0.16,0.47),"Arizona":(0.001382,0.47,0.58),
 "Quebec City":(0.001313,0.04,0.28),"Toronto":(0.001324,0.15,0.34),"Sao Paulo":(0.001382,0.13,0.48),
 "Stockholm":(0.001324,0.03,0.24),"Paris":(0.001347,0.03,0.40),"Frankfurt":(0.001347,0.47,0.40),
 "Milan":(0.001359,0.39,0.43),"Netherlands":(0.001336,0.36,0.40),"Oslo":(0.001324,0.04,0.24),
 "Zurich":(0.001336,0.05,0.36),"Madrid":(0.001359,0.20,0.45),"London":(0.001336,0.25,0.38),
 "Tokyo":(0.001473,0.71,0.53),"Osaka":(0.001473,0.71,0.53),"Seoul":(0.001462,0.61,0.48),
 "New South Wales":(0.001439,0.86,0.47),"Pune":(0.001519,0.96,0.59),"Chennai":(0.001531,0.96,0.62),
 "Mumbai":(0.001531,0.96,0.62),"Dubai":(0.001542,0.65,0.74),"Johannesburg":(0.001382,0.94,0.39),
}
PERUSER["Singapore"]["translate"] = {
 "Central Ohio":(0.1214,49.76,34.59),"Council Bluffs (Iowa)":(0.1196,16.14,32.28),
 "The Dalles (Oregon)":(0.1133,13.60,27.20),"Storey County (Nevada)":(0.1155,32.34,50.24),
 "Henderson (Nevada)":(0.1175,32.89,52.86),"Douglas County (Georgia)":(0.1238,43.32,44.55),
 "The Lowcountry (S. Carolina)":(0.1243,37.28,46.60),"Lenoir (N. Carolina)":(0.1231,36.92,40.61),
 "Jackson County (Alabama)":(0.1233,40.70,44.40),"Indiana":(0.1212,46.07,34.55),
 "Papillion (Nebraska)":(0.1196,35.89,34.09),"Omaha (Nebraska)":(0.1196,35.88,34.09),
 "Northern Virginia":(0.1219,36.58,40.24),"Montgomery County (Tenn.)":(0.1224,36.72,42.23),
 "Midlothian (Texas)":(0.1225,44.10,44.10),"Mayes County (Oklahoma)":(0.1214,46.15,41.90),
 "Dublin (Ireland)":(0.1063,30.83,27.11),"Hamina (Finland)":(0.0989,6.93,19.29),
 "Fredericia (Denmark)":(0.1025,11.28,21.52),"Eemshaven (Netherlands)":(0.1033,27.88,27.88),
 "Hanau (Germany)":(0.1029,36.02,30.88),"Singapore":(0.0663,27.17,27.83),
 "Changhua County (Taiwan)":(0.0774,37.91,30.17),"Inzai City (Japan)":(0.0854,41.01,29.48),
}
PERUSER["Singapore"]["pdf"] = {
 "N. Virginia":(0.01273,3.82,4.20),"Ohio":(0.01262,5.18,3.60),"Oregon":(0.01228,1.47,2.95),
 "Montreal":(0.01240,0.37,2.79),"Dublin (Ireland)":(0.01227,3.56,3.13),"London (UK)":(0.01238,2.35,3.34),
 "Frankfurt (Germany)":(0.01248,4.37,3.74),"Milan (Italy)":(0.01259,3.65,3.97),
 "Zurich (Switzerland)":(0.01237,0.49,3.34),"Paris (France)":(0.01237,0.27,3.71),
 "Stockholm (Sweden)":(0.01215,0.28,2.19),"Tokyo (Japan)":(0.01289,6.19,4.45),
 "Seoul (South Korea)":(0.01289,5.41,4.25),"Melbourne (Australia)":(0.01268,6.85,3.99),
 "Jakarta (Indonesia)":(0.01309,8.51,5.50),
}
PERUSER["Singapore"]["background"] = {
 "Tokyo (serves Asia Pacific)":(0.00345,1.66,1.19),
}
PERUSER["Singapore"]["image"] = {
 "Central Ohio":(0.02329,9.55,6.64),"Council Bluffs (Iowa)":(0.02308,3.12,6.23),
 "The Dalles (Oregon)":(0.02265,2.72,5.44),"Storey County (Nevada)":(0.02370,6.64,10.31),
 "Henderson (Nevada)":(0.02392,6.70,10.76),"Douglas County (Georgia)":(0.02351,8.23,8.46),
 "The Lowcountry (S. Carolina)":(0.02330,6.99,8.74),"Lenoir (N. Carolina)":(0.02330,6.99,7.69),
 "Jackson County (Alabama)":(0.02393,7.90,8.61),"Indiana":(0.02329,8.85,6.64),
 "Papillion (Nebraska)":(0.02329,6.99,6.64),"Omaha (Nebraska)":(0.02329,6.99,6.64),
 "Northern Virginia":(0.02329,6.99,7.69),"Montgomery County (Tenn.)":(0.02329,6.99,8.04),
 "Midlothian (Texas)":(0.02350,8.46,8.46),"Mayes County (Oklahoma)":(0.02329,8.85,8.04),
 "Dublin (Ireland)":(0.02306,6.69,5.88),"Hamina (Finland)":(0.02304,1.61,4.49),
 "Fredericia (Denmark)":(0.02305,2.54,4.84),"Eemshaven (Netherlands)":(0.02305,6.22,6.22),
 "Hanau (Germany)":(0.02326,8.14,6.98),"Singapore":(0.02404,9.86,10.10),
 "Changhua County (Taiwan)":(0.02385,11.69,9.30),"Inzai City (Japan)":(0.02365,11.35,8.16),
}
PERUSER["Singapore"]["video"] = {
 "Virginia":(0.3499,104.98,115.48),"Iowa":(0.3409,46.02,92.04),"Illinois":(0.3469,79.79,98.87),
 "Texas":(0.3560,128.14,128.14),"California":(0.3558,42.70,122.76),"Arizona":(0.3619,123.04,151.99),
 "Quebec City":(0.3439,10.32,72.21),"Toronto":(0.3469,38.16,88.46),"Sao Paulo":(0.3620,34.39,124.88),
 "Stockholm":(0.3466,7.97,62.38),"Paris":(0.3526,7.76,105.79),"Frankfurt":(0.3526,123.42,105.78),
 "Milan":(0.3556,103.13,112.02),"Netherlands":(0.3496,94.40,104.89),"Oslo":(0.3466,10.40,62.39),
 "Zurich":(0.3496,13.99,94.40),"Madrid":(0.3557,53.35,117.38),"London":(0.3497,66.43,99.65),
 "Tokyo":(0.3853,184.95,138.72),"Osaka":(0.3853,184.94,138.71),"Seoul":(0.3823,160.56,126.15),
 "New South Wales":(0.3764,225.83,124.21),"Pune":(0.3972,250.25,154.92),"Chennai":(0.4002,252.11,162.07),
 "Mumbai":(0.4002,252.15,162.10),"Dubai":(0.4034,169.41,193.61),"Johannesburg":(0.3615,245.83,103.03),
}
PERUSER["Singapore"]["voice"] = {
 "Council Bluffs, Iowa":(0.00675,0.91,1.82),"Moncks Corner, S. Carolina":(0.00684,2.05,2.56),
 "Ashburn, Virginia":(0.00682,2.05,2.25),"Columbus, Ohio":(0.00682,2.80,1.94),
 "Dallas, Texas":(0.00688,2.48,2.48),"The Dalles, Oregon":(0.00660,0.79,1.58),
}
PERUSER["Singapore"]["code"] = {
 "Virginia":(0.003078,0.92,1.02),"Iowa":(0.002998,0.40,0.81),"Illinois":(0.003051,0.70,0.87),
 "Texas":(0.003131,1.13,1.13),"California":(0.003131,0.38,1.08),"Arizona":(0.003184,1.08,1.34),
 "Quebec City":(0.003025,0.09,0.64),"Toronto":(0.003051,0.34,0.78),"Sao Paulo":(0.003184,0.30,1.10),
 "Stockholm":(0.003051,0.07,0.55),"Paris":(0.003104,0.07,0.93),"Frankfurt":(0.003104,1.09,0.93),
 "Milan":(0.003130,0.91,0.99),"Netherlands":(0.003077,0.83,0.92),"Oslo":(0.003051,0.09,0.55),
 "Zurich":(0.003077,0.12,0.83),"Madrid":(0.003130,0.47,1.03),"London":(0.003077,0.58,0.88),
 "Tokyo":(0.003395,1.63,1.22),"Osaka":(0.003395,1.63,1.22),"Seoul":(0.003368,1.41,1.11),
 "New South Wales":(0.003315,1.99,1.09),"Pune":(0.003500,2.21,1.37),"Chennai":(0.003527,2.22,1.43),
 "Mumbai":(0.003527,2.22,1.43),"Dubai":(0.003554,1.49,1.71),"Johannesburg":(0.003183,2.16,0.91),
}

# ---- LAGOS ----
PERUSER["Lagos"]["prompt"] = {
 "Virginia":(0.001336,0.40,0.44),"Iowa":(0.001301,0.18,0.35),"Illinois":(0.001324,0.30,0.38),
 "Texas":(0.001359,0.49,0.49),"California":(0.001359,0.16,0.47),"Arizona":(0.001382,0.47,0.58),
 "Quebec City":(0.001312,0.04,0.28),"Toronto":(0.001324,0.15,0.34),"Sao Paulo":(0.001381,0.13,0.48),
 "Stockholm":(0.001324,0.03,0.24),"Paris":(0.001347,0.03,0.40),"Frankfurt":(0.001347,0.47,0.40),
 "Milan":(0.001358,0.39,0.43),"Netherlands":(0.001335,0.36,0.40),"Oslo":(0.001324,0.04,0.24),
 "Zurich":(0.001335,0.05,0.36),"Madrid":(0.001358,0.20,0.45),"London":(0.001335,0.25,0.38),
 "Tokyo":(0.001474,0.71,0.53),"Osaka":(0.001474,0.71,0.53),"Seoul":(0.001462,0.61,0.48),
 "New South Wales":(0.001439,0.86,0.48),"Pune":(0.001519,0.96,0.59),"Chennai":(0.001531,0.96,0.62),
 "Mumbai":(0.001531,0.96,0.62),"Dubai":(0.001542,0.65,0.74),"Johannesburg":(0.001381,0.94,0.39),
}
PERUSER["Lagos"]["translate"] = {
 "Central Ohio":(0.0993,40.71,28.30),"Council Bluffs (Iowa)":(0.1031,13.91,27.83),
 "The Dalles (Oregon)":(0.1092,13.11,26.21),"Storey County (Nevada)":(0.1102,30.86,47.94),
 "Henderson (Nevada)":(0.1096,30.68,49.31),"Douglas County (Georgia)":(0.1001,35.02,36.02),
 "The Lowcountry (S. Carolina)":(0.0986,29.57,36.97),"Lenoir (N. Carolina)":(0.0989,29.67,32.64),
 "Jackson County (Alabama)":(0.1005,33.18,36.20),"Indiana":(0.1003,38.10,28.58),
 "Papillion (Nebraska)":(0.1032,30.95,29.40),"Omaha (Nebraska)":(0.1031,30.94,29.39),
 "Northern Virginia":(0.0976,29.28,32.21),"Montgomery County (Tenn.)":(0.1008,30.23,34.76),
 "Midlothian (Texas)":(0.1042,37.51,37.51),"Mayes County (Oklahoma)":(0.1033,39.25,35.64),
 "Dublin (Ireland)":(0.0850,24.65,21.68),"Hamina (Finland)":(0.0888,6.22,17.31),
 "Fredericia (Denmark)":(0.0857,9.43,18.00),"Eemshaven (Netherlands)":(0.0848,22.90,22.90),
 "Hanau (Germany)":(0.0836,29.26,25.08),"Singapore":(0.1064,43.62,44.68),
 "Changhua County (Taiwan)":(0.1109,54.33,43.24),"Inzai City (Japan)":(0.1147,55.08,39.59),
}
PERUSER["Lagos"]["pdf"] = {
 "N. Virginia":(0.01269,3.81,4.19),"Ohio":(0.01259,5.16,3.59),"Oregon":(0.01227,1.47,2.95),
 "Montreal":(0.01236,0.37,2.78),"Dublin (Ireland)":(0.01223,3.55,3.12),"London (UK)":(0.01234,2.34,3.33),
 "Frankfurt (Germany)":(0.01245,4.36,3.73),"Milan (Italy)":(0.01256,3.64,3.96),
 "Zurich (Switzerland)":(0.01234,0.49,3.33),"Paris (France)":(0.01234,0.27,3.70),
 "Stockholm (Sweden)":(0.01213,0.28,2.18),"Tokyo (Japan)":(0.01294,6.21,4.46),
 "Seoul (South Korea)":(0.01293,5.43,4.27),"Melbourne (Australia)":(0.01273,6.87,4.01),
 "Jakarta (Indonesia)":(0.01315,8.55,5.52),
}
PERUSER["Lagos"]["background"] = {
 "Dublin (serves EMEA)":(0.00329,0.95,0.84),
}
PERUSER["Lagos"]["image"] = {
 "Central Ohio":(0.02326,9.54,6.63),"Council Bluffs (Iowa)":(0.02305,3.11,6.22),
 "The Dalles (Oregon)":(0.02264,2.72,5.43),"Storey County (Nevada)":(0.02369,6.63,10.31),
 "Henderson (Nevada)":(0.02390,6.69,10.76),"Douglas County (Georgia)":(0.02347,8.21,8.45),
 "The Lowcountry (S. Carolina)":(0.02325,6.98,8.72),"Lenoir (N. Carolina)":(0.02325,6.98,7.67),
 "Jackson County (Alabama)":(0.02389,7.88,8.60),"Indiana":(0.02326,8.84,6.63),
 "Papillion (Nebraska)":(0.02326,6.98,6.63),"Omaha (Nebraska)":(0.02326,6.98,6.63),
 "Northern Virginia":(0.02325,6.98,7.67),"Montgomery County (Tenn.)":(0.02326,6.98,8.02),
 "Midlothian (Texas)":(0.02347,8.45,8.45),"Mayes County (Oklahoma)":(0.02326,8.84,8.03),
 "Dublin (Ireland)":(0.02302,6.68,5.87),"Hamina (Finland)":(0.02303,1.61,4.49),
 "Fredericia (Denmark)":(0.02302,2.53,4.84),"Eemshaven (Netherlands)":(0.02302,6.22,6.22),
 "Hanau (Germany)":(0.02323,8.13,6.97),"Singapore":(0.02411,9.88,10.13),
 "Changhua County (Taiwan)":(0.02390,11.71,9.32),"Inzai City (Japan)":(0.02370,11.38,8.18),
}
PERUSER["Lagos"]["video"] = {
 "Virginia":(0.3495,104.86,115.34),"Iowa":(0.3406,45.98,91.96),"Illinois":(0.3466,79.71,98.77),
 "Texas":(0.3556,128.03,128.03),"California":(0.3558,42.69,122.74),"Arizona":(0.3617,122.98,151.92),
 "Quebec City":(0.3435,10.31,72.14),"Toronto":(0.3465,38.12,88.37),"Sao Paulo":(0.3614,34.33,124.68),
 "Stockholm":(0.3464,7.97,62.35),"Paris":(0.3523,7.75,105.69),"Frankfurt":(0.3523,123.30,105.69),
 "Milan":(0.3553,103.03,111.91),"Netherlands":(0.3493,94.31,104.79),"Oslo":(0.3464,10.39,62.34),
 "Zurich":(0.3493,13.97,94.30),"Madrid":(0.3552,53.29,117.23),"London":(0.3493,66.37,99.55),
 "Tokyo":(0.3858,185.19,138.89),"Osaka":(0.3858,185.18,138.89),"Seoul":(0.3827,160.75,126.31),
 "New South Wales":(0.3769,226.16,124.39),"Pune":(0.3975,250.40,155.01),"Chennai":(0.4005,252.32,162.21),
 "Mumbai":(0.4005,252.29,162.19),"Dubai":(0.4034,169.41,193.61),"Johannesburg":(0.3613,245.66,102.96),
}
PERUSER["Lagos"]["voice"] = {
 "Council Bluffs, Iowa":(0.00664,0.90,1.79),"Moncks Corner, S. Carolina":(0.00667,2.00,2.50),
 "Ashburn, Virginia":(0.00666,2.00,2.20),"Columbus, Ohio":(0.00667,2.74,1.90),
 "Dallas, Texas":(0.00676,2.43,2.43),"The Dalles, Oregon":(0.00657,0.79,1.58),
}
PERUSER["Lagos"]["code"] = {
 "Virginia":(0.003077,0.92,1.02),"Iowa":(0.002998,0.40,0.81),"Illinois":(0.003051,0.70,0.87),
 "Texas":(0.003130,1.13,1.13),"California":(0.003131,0.38,1.08),"Arizona":(0.003183,1.08,1.34),
 "Quebec City":(0.003024,0.09,0.64),"Toronto":(0.003051,0.34,0.78),"Sao Paulo":(0.003183,0.30,1.10),
 "Stockholm":(0.003050,0.07,0.55),"Paris":(0.003103,0.07,0.93),"Frankfurt":(0.003103,1.09,0.93),
 "Milan":(0.003130,0.91,0.99),"Netherlands":(0.003077,0.83,0.92),"Oslo":(0.003050,0.09,0.55),
 "Zurich":(0.003077,0.12,0.83),"Madrid":(0.003129,0.47,1.03),"London":(0.003077,0.58,0.88),
 "Tokyo":(0.003396,1.63,1.22),"Osaka":(0.003396,1.63,1.22),"Seoul":(0.003369,1.42,1.11),
 "New South Wales":(0.003316,1.99,1.09),"Pune":(0.003501,2.21,1.37),"Chennai":(0.003528,2.22,1.43),
 "Mumbai":(0.003527,2.22,1.43),"Dubai":(0.003554,1.49,1.71),"Johannesburg":(0.003183,2.16,0.91),
}

# ---- CHICAGO ----
PERUSER["Chicago"]["prompt"] = {
 "Virginia":(0.001335,0.40,0.44),"Iowa":(0.001301,0.18,0.35),"Illinois":(0.001324,0.30,0.38),
 "Texas":(0.001358,0.49,0.49),"California":(0.001358,0.16,0.47),"Arizona":(0.001381,0.47,0.58),
 "Quebec City":(0.001312,0.04,0.28),"Toronto":(0.001324,0.15,0.34),"Sao Paulo":(0.001382,0.13,0.48),
 "Stockholm":(0.001324,0.03,0.24),"Paris":(0.001347,0.03,0.40),"Frankfurt":(0.001347,0.47,0.40),
 "Milan":(0.001358,0.39,0.43),"Netherlands":(0.001335,0.36,0.40),"Oslo":(0.001324,0.04,0.24),
 "Zurich":(0.001335,0.05,0.36),"Madrid":(0.001358,0.20,0.45),"London":(0.001335,0.25,0.38),
 "Tokyo":(0.001474,0.71,0.53),"Osaka":(0.001474,0.71,0.53),"Seoul":(0.001462,0.61,0.48),
 "New South Wales":(0.001439,0.86,0.48),"Pune":(0.001520,0.96,0.59),"Chennai":(0.001531,0.96,0.62),
 "Mumbai":(0.001531,0.96,0.62),"Dubai":(0.001543,0.65,0.74),"Johannesburg":(0.001382,0.94,0.39),
}
PERUSER["Chicago"]["translate"] = {
 "Central Ohio":(0.0676,27.73,19.28),"Council Bluffs (Iowa)":(0.0685,9.24,18.49),
 "The Dalles (Oregon)":(0.0756,9.08,18.15),"Storey County (Nevada)":(0.0758,21.22,32.97),
 "Henderson (Nevada)":(0.0750,21.00,33.75),"Douglas County (Georgia)":(0.0695,24.33,25.02),
 "The Lowcountry (S. Carolina)":(0.0703,21.08,26.35),"Lenoir (N. Carolina)":(0.0691,20.73,22.80),
 "Jackson County (Alabama)":(0.0691,22.80,24.88),"Indiana":(0.0670,25.46,19.10),
 "Papillion (Nebraska)":(0.0686,20.58,19.55),"Omaha (Nebraska)":(0.0686,20.57,19.54),
 "Northern Virginia":(0.0693,20.80,22.88),"Montgomery County (Tenn.)":(0.0682,20.46,23.53),
 "Midlothian (Texas)":(0.0709,25.52,25.52),"Mayes County (Oklahoma)":(0.0693,26.34,23.91),
 "Dublin (Ireland)":(0.0872,25.29,22.24),"Hamina (Finland)":(0.0919,6.43,17.92),
 "Fredericia (Denmark)":(0.0901,9.91,18.92),"Eemshaven (Netherlands)":(0.0900,24.29,24.29),
 "Hanau (Germany)":(0.0912,31.91,27.35),"Singapore":(0.1205,49.42,50.62),
 "Changhua County (Taiwan)":(0.1099,53.85,42.86),"Inzai City (Japan)":(0.1025,49.21,35.37),
}
PERUSER["Chicago"]["pdf"] = {
 "N. Virginia":(0.01265,3.79,4.17),"Ohio":(0.01253,5.14,3.57),"Oregon":(0.01222,1.47,2.93),
 "Montreal":(0.01232,0.37,2.77),"Dublin (Ireland)":(0.01224,3.55,3.12),"London (UK)":(0.01235,2.35,3.33),
 "Frankfurt (Germany)":(0.01246,4.36,3.74),"Milan (Italy)":(0.01257,3.65,3.96),
 "Zurich (Switzerland)":(0.01235,0.49,3.34),"Paris (France)":(0.01235,0.27,3.71),
 "Stockholm (Sweden)":(0.01213,0.28,2.18),"Tokyo (Japan)":(0.01292,6.20,4.46),
 "Seoul (South Korea)":(0.01292,5.43,4.26),"Melbourne (Australia)":(0.01273,6.88,4.01),
 "Jakarta (Indonesia)":(0.01317,8.56,5.53),
}
PERUSER["Chicago"]["background"] = {
 "Virginia (serves N. America)":(0.00335,1.00,1.10),
}
PERUSER["Chicago"]["image"] = {
 "Central Ohio":(0.02320,9.51,6.61),"Council Bluffs (Iowa)":(0.02299,3.10,6.21),
 "The Dalles (Oregon)":(0.02259,2.71,5.42),"Storey County (Nevada)":(0.02364,6.62,10.28),
 "Henderson (Nevada)":(0.02384,6.68,10.73),"Douglas County (Georgia)":(0.02342,8.20,8.43),
 "The Lowcountry (S. Carolina)":(0.02321,6.96,8.70),"Lenoir (N. Carolina)":(0.02321,6.96,7.66),
 "Jackson County (Alabama)":(0.02383,7.87,8.58),"Indiana":(0.02320,8.82,6.61),
 "Papillion (Nebraska)":(0.02320,6.96,6.61),"Omaha (Nebraska)":(0.02320,6.96,6.61),
 "Northern Virginia":(0.02321,6.96,7.66),"Montgomery County (Tenn.)":(0.02320,6.96,8.01),
 "Midlothian (Texas)":(0.02342,8.43,8.43),"Mayes County (Oklahoma)":(0.02321,8.82,8.01),
 "Dublin (Ireland)":(0.02303,6.68,5.87),"Hamina (Finland)":(0.02303,1.61,4.49),
 "Fredericia (Denmark)":(0.02303,2.53,4.84),"Eemshaven (Netherlands)":(0.02303,6.22,6.22),
 "Hanau (Germany)":(0.02324,8.14,6.97),"Singapore":(0.02413,9.89,10.14),
 "Changhua County (Taiwan)":(0.02390,11.71,9.32),"Inzai City (Japan)":(0.02368,11.37,8.17),
}
PERUSER["Chicago"]["video"] = {
 "Virginia":(0.3491,104.72,115.19),"Iowa":(0.3400,45.90,91.81),"Illinois":(0.3460,79.58,98.61),
 "Texas":(0.3551,127.84,127.84),"California":(0.3552,42.62,122.54),"Arizona":(0.3611,122.79,151.68),
 "Quebec City":(0.3431,10.29,72.05),"Toronto":(0.3460,38.07,88.24),"Sao Paulo":(0.3615,34.34,124.72),
 "Stockholm":(0.3464,7.97,62.35),"Paris":(0.3524,7.75,105.72),"Frankfurt":(0.3524,123.35,105.73),
 "Milan":(0.3554,103.08,111.96),"Netherlands":(0.3494,94.34,104.82),"Oslo":(0.3464,10.39,62.35),
 "Zurich":(0.3494,13.98,94.35),"Madrid":(0.3554,53.31,117.28),"London":(0.3494,66.38,99.57),
 "Tokyo":(0.3856,185.09,138.82),"Osaka":(0.3856,185.10,138.83),"Seoul":(0.3826,160.71,126.27),
 "New South Wales":(0.3769,226.14,124.38),"Pune":(0.3978,250.60,155.14),"Chennai":(0.4008,252.52,162.34),
 "Mumbai":(0.4008,252.49,162.32),"Dubai":(0.4037,169.55,193.78),"Johannesburg":(0.3618,246.05,103.12),
}
PERUSER["Chicago"]["voice"] = {
 "Council Bluffs, Iowa":(0.00641,0.87,1.73),"Moncks Corner, S. Carolina":(0.00648,1.94,2.43),
 "Ashburn, Virginia":(0.00647,1.94,2.14),"Columbus, Ohio":(0.00646,2.65,1.84),
 "Dallas, Texas":(0.00654,2.35,2.35),"The Dalles, Oregon":(0.00635,0.76,1.52),
}
PERUSER["Chicago"]["code"] = {
 "Virginia":(0.003076,0.92,1.02),"Iowa":(0.002997,0.40,0.81),"Illinois":(0.003050,0.70,0.87),
 "Texas":(0.003129,1.13,1.13),"California":(0.003129,0.38,1.08),"Arizona":(0.003182,1.08,1.34),
 "Quebec City":(0.003023,0.09,0.63),"Toronto":(0.003050,0.34,0.78),"Sao Paulo":(0.003183,0.30,1.10),
 "Stockholm":(0.003050,0.07,0.55),"Paris":(0.003103,0.07,0.93),"Frankfurt":(0.003103,1.09,0.93),
 "Milan":(0.003130,0.91,0.99),"Netherlands":(0.003077,0.83,0.92),"Oslo":(0.003050,0.09,0.55),
 "Zurich":(0.003077,0.12,0.83),"Madrid":(0.003130,0.47,1.03),"London":(0.003077,0.58,0.88),
 "Tokyo":(0.003395,1.63,1.22),"Osaka":(0.003395,1.63,1.22),"Seoul":(0.003369,1.41,1.11),
 "New South Wales":(0.003316,1.99,1.09),"Pune":(0.003502,2.21,1.37),"Chennai":(0.003528,2.22,1.43),
 "Mumbai":(0.003528,2.22,1.43),"Dubai":(0.003554,1.49,1.71),"Johannesburg":(0.003184,2.16,0.91),
}

# ---- SAO PAULO ----
PERUSER["SaoPaulo"]["prompt"] = {
 "Virginia":(0.001335,0.40,0.44),"Iowa":(0.001301,0.18,0.35),"Illinois":(0.001324,0.30,0.38),
 "Texas":(0.001358,0.49,0.49),"California":(0.001359,0.16,0.47),"Arizona":(0.001382,0.47,0.58),
 "Quebec City":(0.001312,0.04,0.28),"Toronto":(0.001324,0.15,0.34),"Sao Paulo":(0.001381,0.13,0.48),
 "Stockholm":(0.001324,0.03,0.24),"Paris":(0.001347,0.03,0.40),"Frankfurt":(0.001347,0.47,0.40),
 "Milan":(0.001359,0.39,0.43),"Netherlands":(0.001336,0.36,0.40),"Oslo":(0.001324,0.04,0.24),
 "Zurich":(0.001336,0.05,0.36),"Madrid":(0.001359,0.20,0.45),"London":(0.001336,0.25,0.38),
 "Tokyo":(0.001474,0.71,0.53),"Osaka":(0.001474,0.71,0.53),"Seoul":(0.001463,0.61,0.48),
 "New South Wales":(0.001439,0.86,0.48),"Pune":(0.001520,0.96,0.59),"Chennai":(0.001531,0.96,0.62),
 "Mumbai":(0.001531,0.96,0.62),"Dubai":(0.001543,0.65,0.74),"Johannesburg":(0.001381,0.94,0.39),
}
PERUSER["SaoPaulo"]["translate"] = {
 "Central Ohio":(0.0949,38.90,27.04),"Council Bluffs (Iowa)":(0.0977,13.19,26.38),
 "The Dalles (Oregon)":(0.1045,12.55,25.09),"Storey County (Nevada)":(0.1032,28.89,44.88),
 "Henderson (Nevada)":(0.1014,28.38,45.61),"Douglas County (Georgia)":(0.0932,32.63,33.56),
 "The Lowcountry (S. Carolina)":(0.0921,27.63,34.54),"Lenoir (N. Carolina)":(0.0933,27.98,30.78),
 "Jackson County (Alabama)":(0.0939,31.00,33.82),"Indiana":(0.0954,36.24,27.18),
 "Papillion (Nebraska)":(0.0978,29.33,27.87),"Omaha (Nebraska)":(0.0978,29.34,27.87),
 "Northern Virginia":(0.0936,28.09,30.90),"Montgomery County (Tenn.)":(0.0946,28.38,32.63),
 "Midlothian (Texas)":(0.0957,34.44,34.44),"Mayes County (Oklahoma)":(0.0962,36.57,33.20),
 "Dublin (Ireland)":(0.0998,28.95,25.45),"Hamina (Finland)":(0.1072,7.50,20.90),
 "Fredericia (Denmark)":(0.1030,11.33,21.63),"Eemshaven (Netherlands)":(0.1019,27.52,27.52),
 "Hanau (Germany)":(0.1015,35.52,30.45),"Singapore":(0.1238,50.77,52.01),
 "Changhua County (Taiwan)":(0.1336,65.44,52.09),"Inzai City (Japan)":(0.1328,63.73,45.80),
}
PERUSER["SaoPaulo"]["pdf"] = {
 "N. Virginia":(0.01269,3.81,4.19),"Ohio":(0.01258,5.16,3.58),"Oregon":(0.01226,1.47,2.94),
 "Montreal":(0.01236,0.37,2.78),"Dublin (Ireland)":(0.01226,3.55,3.13),"London (UK)":(0.01237,2.35,3.34),
 "Frankfurt (Germany)":(0.01248,4.37,3.74),"Milan (Italy)":(0.01259,3.65,3.96),
 "Zurich (Switzerland)":(0.01237,0.49,3.34),"Paris (France)":(0.01237,0.27,3.71),
 "Stockholm (Sweden)":(0.01216,0.28,2.19),"Tokyo (Japan)":(0.01297,6.23,4.48),
 "Seoul (South Korea)":(0.01297,5.45,4.28),"Melbourne (Australia)":(0.01272,6.87,4.01),
 "Jakarta (Indonesia)":(0.01317,8.56,5.53),
}
PERUSER["SaoPaulo"]["background"] = {
 "Virginia (serves N. America)":(0.00343,1.03,1.13),
}
PERUSER["SaoPaulo"]["image"] = {
 "Central Ohio":(0.02325,9.53,6.63),"Council Bluffs (Iowa)":(0.02304,3.11,6.22),
 "The Dalles (Oregon)":(0.02263,2.72,5.43),"Storey County (Nevada)":(0.02368,6.63,10.30),
 "Henderson (Nevada)":(0.02389,6.69,10.75),"Douglas County (Georgia)":(0.02346,8.21,8.44),
 "The Lowcountry (S. Carolina)":(0.02324,6.97,8.72),"Lenoir (N. Carolina)":(0.02325,6.97,7.67),
 "Jackson County (Alabama)":(0.02388,7.88,8.60),"Indiana":(0.02325,8.84,6.63),
 "Papillion (Nebraska)":(0.02325,6.98,6.63),"Omaha (Nebraska)":(0.02325,6.98,6.63),
 "Northern Virginia":(0.02325,6.97,7.67),"Montgomery County (Tenn.)":(0.02325,6.97,8.02),
 "Midlothian (Texas)":(0.02346,8.45,8.45),"Mayes County (Oklahoma)":(0.02325,8.84,8.02),
 "Dublin (Ireland)":(0.02305,6.68,5.88),"Hamina (Finland)":(0.02306,1.61,4.50),
 "Fredericia (Denmark)":(0.02305,2.54,4.84),"Eemshaven (Netherlands)":(0.02305,6.22,6.22),
 "Hanau (Germany)":(0.02326,8.14,6.98),"Singapore":(0.02414,9.90,10.14),
 "Changhua County (Taiwan)":(0.02394,11.73,9.34),"Inzai City (Japan)":(0.02373,11.39,8.19),
}
PERUSER["SaoPaulo"]["video"] = {
 "Virginia":(0.3495,104.84,115.32),"Iowa":(0.3405,45.97,91.94),"Illinois":(0.3465,79.70,98.75),
 "Texas":(0.3555,127.98,127.98),"California":(0.3556,42.68,122.69),"Arizona":(0.3616,122.93,151.86),
 "Quebec City":(0.3435,10.31,72.13),"Toronto":(0.3465,38.11,88.36),"Sao Paulo":(0.3610,34.30,124.55),
 "Stockholm":(0.3467,7.97,62.40),"Paris":(0.3526,7.76,105.77),"Frankfurt":(0.3526,123.41,105.78),
 "Milan":(0.3556,103.12,112.01),"Netherlands":(0.3496,94.39,104.88),"Oslo":(0.3466,10.40,62.40),
 "Zurich":(0.3496,13.98,94.39),"Madrid":(0.3555,53.33,117.32),"London":(0.3496,66.42,99.63),
 "Tokyo":(0.3861,185.33,139.00),"Osaka":(0.3861,185.34,139.01),"Seoul":(0.3831,160.90,126.42),
 "New South Wales":(0.3768,226.08,124.34),"Pune":(0.3978,250.63,155.15),"Chennai":(0.4009,252.54,162.35),
 "Mumbai":(0.4008,252.52,162.34),"Dubai":(0.4037,169.57,193.79),"Johannesburg":(0.3614,245.78,103.01),
}
PERUSER["SaoPaulo"]["voice"] = {
 "Council Bluffs, Iowa":(0.00661,0.89,1.78),"Moncks Corner, S. Carolina":(0.00662,1.99,2.48),
 "Ashburn, Virginia":(0.00663,1.99,2.19),"Columbus, Ohio":(0.00664,2.72,1.89),
 "Dallas, Texas":(0.00670,2.41,2.41),"The Dalles, Oregon":(0.00654,0.79,1.57),
}
PERUSER["SaoPaulo"]["code"] = {
 "Virginia":(0.003077,0.92,1.02),"Iowa":(0.002998,0.40,0.81),"Illinois":(0.003051,0.70,0.87),
 "Texas":(0.003130,1.13,1.13),"California":(0.003130,0.38,1.08),"Arizona":(0.003183,1.08,1.34),
 "Quebec City":(0.003024,0.09,0.64),"Toronto":(0.003050,0.34,0.78),"Sao Paulo":(0.003182,0.30,1.10),
 "Stockholm":(0.003051,0.07,0.55),"Paris":(0.003104,0.07,0.93),"Frankfurt":(0.003104,1.09,0.93),
 "Milan":(0.003130,0.91,0.99),"Netherlands":(0.003077,0.83,0.92),"Oslo":(0.003051,0.09,0.55),
 "Zurich":(0.003077,0.12,0.83),"Madrid":(0.003130,0.47,1.03),"London":(0.003077,0.58,0.88),
 "Tokyo":(0.003396,1.63,1.22),"Osaka":(0.003396,1.63,1.22),"Seoul":(0.003370,1.42,1.11),
 "New South Wales":(0.003316,1.99,1.09),"Pune":(0.003502,2.21,1.37),"Chennai":(0.003528,2.22,1.43),
 "Mumbai":(0.003528,2.22,1.43),"Dubai":(0.003554,1.49,1.71),"Johannesburg":(0.003183,2.16,0.91),
}

# ---------------------------------------------------------------------------
# 4b. DISTANCES (km) origin city -> destination, per operation, from the PDF.
#     Keyed identically to PERUSER so destination names always match.
#     For prompt/video/code the distance set is identical (same OpenAI list);
#     image/translate share the Google list; pdf, voice, background have own.
# ---------------------------------------------------------------------------
DIST = collections.defaultdict(dict)

# Distance sets are city-specific. Within a city, several operations share a
# destination->distance mapping because the data center cities coincide.
# We define per-city base maps and then assign to each operation by its dest list.

def assign(city, op, basemap):
    # Attach distances to (city,op) using whatever destinations that op has.
    DIST[city][op] = {d: basemap[d] for d in PERUSER[city][op] if d in basemap}

# ----- BARCELONA distance maps -----
BCN_OPENAI = {  # prompt / video / code
 "Virginia":6516,"Iowa":7508,"Illinois":7081,"Texas":8699,"California":9581,"Arizona":9322,
 "Quebec City":5674,"Toronto":6402,"Sao Paulo":8797,"Stockholm":2279,"Paris":831,"Frankfurt":1103,
 "Milan":725,"Netherlands":1238,"Oslo":2142,"Zurich":836,"Madrid":505,"London":1139,
 "Tokyo":10413,"Osaka":10307,"Seoul":9602,"New South Wales":17181,"Pune":7151,"Chennai":8064,
 "Mumbai":7031,"Dubai":5164,"Johannesburg":7974,
}
BCN_GOOGLE = {  # translate / image
 "Central Ohio":6866,"Council Bluffs (Iowa)":7680,"The Dalles (Oregon)":8830,"Storey County (Nevada)":9259,
 "Henderson (Nevada)":9291,"Douglas County (Georgia)":7383,"The Lowcountry (S. Carolina)":7094,
 "Lenoir (N. Carolina)":7003,"Jackson County (Alabama)":7407,"Indiana":7106,"Papillion (Nebraska)":7700,
 "Omaha (Nebraska)":7685,"Northern Virginia":6516,"Montgomery County (Tenn.)":7397,"Midlothian (Texas)":8369,
 "Mayes County (Oklahoma)":7977,"Dublin (Ireland)":1471,"Hamina (Finland)":2726,"Fredericia (Denmark)":1670,
 "Eemshaven (Netherlands)":1385,"Hanau (Germany)":1103,"Singapore":10876,"Changhua County (Taiwan)":10363,
 "Inzai City (Japan)":10421,
}
BCN_PDF = {
 "N. Virginia":6516,"Ohio":6866,"Oregon":8830,"Montreal":5899,"Dublin (Ireland)":1471,"London (UK)":1139,
 "Frankfurt (Germany)":1103,"Milan (Italy)":725,"Zurich (Switzerland)":836,"Paris (France)":831,
 "Stockholm (Sweden)":2279,"Tokyo (Japan)":10413,"Seoul (South Korea)":9602,"Melbourne (Australia)":16827,
 "Jakarta (Indonesia)":11687,
}
BCN_VOICE = {
 "Council Bluffs, Iowa":7680,"Moncks Corner, S. Carolina":7052,"Ashburn, Virginia":6516,
 "Columbus, Ohio":6867,"Dallas, Texas":8334,"The Dalles, Oregon":8830,
}
BCN_BG = {"Dublin (serves EMEA)":1471}
for op,bm in [("prompt",BCN_OPENAI),("video",BCN_OPENAI),("code",BCN_OPENAI),
              ("translate",BCN_GOOGLE),("image",BCN_GOOGLE),("pdf",BCN_PDF),
              ("voice",BCN_VOICE),("background",BCN_BG)]:
    assign("Barcelona",op,bm)

# ----- RIYADH distance maps -----
RUH_OPENAI = {
 "Virginia":10857,"Iowa":11586,"Illinois":11247,"Texas":12939,"California":13012,"Arizona":13168,
 "Quebec City":9918,"Toronto":10635,"Sao Paulo":11388,"Stockholm":4444,"Paris":4677,"Frankfurt":4294,
 "Milan":4061,"Netherlands":4655,"Oslo":4789,"Zurich":4189,"Madrid":4958,"London":4939,
 "Tokyo":8689,"Osaka":8376,"Seoul":7550,"New South Wales":12785,"Pune":2888,"Chennai":3751,
 "Mumbai":2770,"Dubai":868,"Johannesburg":6004,
}
RUH_GOOGLE = {
 "Central Ohio":11132,"Council Bluffs (Iowa)":11725,"The Dalles (Oregon)":12101,"Storey County (Nevada)":12735,
 "Henderson (Nevada)":12990,"Douglas County (Georgia)":11737,"The Lowcountry (S. Carolina)":11497,
 "Lenoir (N. Carolina)":11355,"Jackson County (Alabama)":11731,"Indiana":11337,"Papillion (Nebraska)":11744,
 "Omaha (Nebraska)":11729,"Northern Virginia":10857,"Montgomery County (Tenn.)":11675,"Midlothian (Texas)":12579,
 "Mayes County (Oklahoma)":12142,"Dublin (Ireland)":5396,"Hamina (Finland)":4257,"Fredericia (Denmark)":4551,
 "Eemshaven (Netherlands)":4592,"Hanau (Germany)":4294,"Singapore":6653,"Changhua County (Taiwan)":7376,
 "Inzai City (Japan)":8724,
}
RUH_PDF = {
 "N. Virginia":10857,"Ohio":11132,"Oregon":12101,"Montreal":10151,"Dublin (Ireland)":5396,"London (UK)":4939,
 "Frankfurt (Germany)":4294,"Milan (Italy)":4061,"Zurich (Switzerland)":4189,"Paris (France)":4677,
 "Stockholm (Sweden)":4444,"Tokyo (Japan)":8689,"Seoul (South Korea)":7550,"Melbourne (Australia)":12352,
 "Jakarta (Indonesia)":7358,
}
RUH_VOICE = {
 "Council Bluffs, Iowa":11725,"Moncks Corner, S. Carolina":11455,"Ashburn, Virginia":10857,
 "Columbus, Ohio":11134,"Dallas, Texas":12542,"The Dalles, Oregon":12101,
}
RUH_BG = {"Dublin (serves EMEA)":5396}
for op,bm in [("prompt",RUH_OPENAI),("video",RUH_OPENAI),("code",RUH_OPENAI),
              ("translate",RUH_GOOGLE),("image",RUH_GOOGLE),("pdf",RUH_PDF),
              ("voice",RUH_VOICE),("background",RUH_BG)]:
    assign("Riyadh",op,bm)

# ----- SINGAPORE distance maps -----
SIN_OPENAI = {
 "Virginia":15522,"Iowa":14927,"Illinois":15072,"Texas":15852,"California":13647,"Arizona":14623,
 "Quebec City":14638,"Toronto":15001,"Sao Paulo":15987,"Stockholm":9637,"Paris":10729,"Frankfurt":10241,
 "Milan":10261,"Netherlands":10492,"Oslo":10048,"Zurich":10294,"Madrid":11380,"London":10848,
 "Tokyo":5311,"Osaka":4951,"Seoul":4672,"New South Wales":6306,"Pune":3784,"Chennai":2902,
 "Mumbai":3904,"Dubai":5837,"Johannesburg":8659,
}
SIN_GOOGLE = {
 "Central Ohio":15365,"Council Bluffs (Iowa)":14877,"The Dalles (Oregon)":13181,"Storey County (Nevada)":13704,
 "Henderson (Nevada)":14237,"Douglas County (Georgia)":16016,"The Lowcountry (S. Carolina)":16170,
 "Lenoir (N. Carolina)":15835,"Jackson County (Alabama)":15869,"Indiana":15331,"Papillion (Nebraska)":14881,
 "Omaha (Nebraska)":14874,"Northern Virginia":15522,"Montgomery County (Tenn.)":15651,"Midlothian (Texas)":15663,
 "Mayes County (Oklahoma)":15387,"Dublin (Ireland)":11199,"Hamina (Finland)":9150,"Fredericia (Denmark)":10139,
 "Eemshaven (Netherlands)":10349,"Hanau (Germany)":10241,"Singapore":0,"Changhua County (Taiwan)":3097,
 "Inzai City (Japan)":5357,
}
SIN_PDF = {
 "N. Virginia":15522,"Ohio":15365,"Oregon":13181,"Montreal":14799,"Dublin (Ireland)":11199,"London (UK)":10848,
 "Frankfurt (Germany)":10241,"Milan (Italy)":10261,"Zurich (Switzerland)":10294,"Paris (France)":10729,
 "Stockholm (Sweden)":9637,"Tokyo (Japan)":5311,"Seoul (South Korea)":4672,"Melbourne (Australia)":6063,
 "Jakarta (Indonesia)":906,
}
SIN_VOICE = {
 "Council Bluffs, Iowa":14877,"Moncks Corner, S. Carolina":16152,"Ashburn, Virginia":15522,
 "Columbus, Ohio":15369,"Dallas, Texas":15646,"The Dalles, Oregon":13181,
}
SIN_BG = {"Tokyo (serves Asia Pacific)":5311}
for op,bm in [("prompt",SIN_OPENAI),("video",SIN_OPENAI),("code",SIN_OPENAI),
              ("translate",SIN_GOOGLE),("image",SIN_GOOGLE),("pdf",SIN_PDF),
              ("voice",SIN_VOICE),("background",SIN_BG)]:
    assign("Singapore",op,bm)

# ----- LAGOS distance maps -----
LOS_OPENAI = {
 "Virginia":8764,"Iowa":10104,"Illinois":9607,"Texas":10788,"California":12540,"Arizona":11906,
 "Quebec City":8308,"Toronto":8925,"Sao Paulo":6374,"Stockholm":6003,"Paris":4709,"Frankfurt":4876,
 "Milan":4366,"Netherlands":5100,"Oslo":5969,"Zurich":4569,"Madrid":3834,"London":5013,
 "Tokyo":13468,"Osaka":13221,"Seoul":12398,"New South Wales":15524,"Pune":7724,"Chennai":8429,
 "Mumbai":7621,"Dubai":5882,"Johannesburg":4508,
}
LOS_GOOGLE = {
 "Central Ohio":9234,"Council Bluffs (Iowa)":10294,"The Dalles (Oregon)":12037,"Storey County (Nevada)":12235,
 "Henderson (Nevada)":12047,"Douglas County (Georgia)":9433,"The Lowcountry (S. Carolina)":9034,
 "Lenoir (N. Carolina)":9126,"Jackson County (Alabama)":9537,"Indiana":9504,"Papillion (Nebraska)":10311,
 "Omaha (Nebraska)":10301,"Northern Virginia":8764,"Montgomery County (Tenn.)":9641,"Midlothian (Texas)":10581,
 "Mayes County (Oklahoma)":10345,"Dublin (Ireland)":5280,"Hamina (Finland)":6331,"Fredericia (Denmark)":5482,
 "Eemshaven (Netherlands)":5226,"Hanau (Germany)":4876,"Singapore":11143,"Changhua County (Taiwan)":12404,
 "Inzai City (Japan)":13494,
}
LOS_PDF = {
 "N. Virginia":8764,"Ohio":9234,"Oregon":12037,"Montreal":8475,"Dublin (Ireland)":5280,"London (UK)":5013,
 "Frankfurt (Germany)":4876,"Milan (Italy)":4366,"Zurich (Switzerland)":4569,"Paris (France)":4709,
 "Stockholm (Sweden)":6003,"Tokyo (Japan)":13468,"Seoul (South Korea)":12398,"Melbourne (Australia)":14812,
 "Jakarta (Indonesia)":11567,
}
LOS_VOICE = {
 "Council Bluffs, Iowa":10294,"Moncks Corner, S. Carolina":8997,"Ashburn, Virginia":8764,
 "Columbus, Ohio":9233,"Dallas, Texas":10557,"The Dalles, Oregon":12037,
}
LOS_BG = {"Dublin (serves EMEA)":5280}
for op,bm in [("prompt",LOS_OPENAI),("video",LOS_OPENAI),("code",LOS_OPENAI),
              ("translate",LOS_GOOGLE),("image",LOS_GOOGLE),("pdf",LOS_PDF),
              ("voice",LOS_VOICE),("background",LOS_BG)]:
    assign("Lagos",op,bm)

# ----- CHICAGO distance maps -----
CHI_OPENAI = {
 "Virginia":913,"Iowa":498,"Illinois":0,"Texas":1694,"California":2958,"Arizona":2336,
 "Quebec City":1413,"Toronto":701,"Sao Paulo":8408,"Stockholm":6880,"Paris":6650,"Frankfurt":6977,
 "Milan":7290,"Netherlands":6608,"Oslo":6500,"Zurich":7126,"Madrid":6725,"London":6353,
 "Tokyo":10141,"Osaka":10434,"Seoul":10509,"New South Wales":14876,"Pune":13035,"Chennai":13779,
 "Mumbai":12947,"Dubai":11638,"Johannesburg":13983,
}
CHI_GOOGLE = {
 "Central Ohio":441,"Council Bluffs (Iowa)":688,"The Dalles (Oregon)":2707,"Storey County (Nevada)":2673,
 "Henderson (Nevada)":2441,"Douglas County (Georgia)":944,"The Lowcountry (S. Carolina)":1175,
 "Lenoir (N. Carolina)":847,"Jackson County (Alabama)":802,"Indiana":265,"Papillion (Nebraska)":705,
 "Omaha (Nebraska)":694,"Northern Virginia":913,"Montgomery County (Tenn.)":599,"Midlothian (Texas)":1332,
 "Mayes County (Oklahoma)":903,"Dublin (Ireland)":5890,"Hamina (Finland)":7191,"Fredericia (Denmark)":6698,
 "Eemshaven (Netherlands)":6659,"Hanau (Germany)":6977,"Singapore":15072,"Changhua County (Taiwan)":12134,
 "Inzai City (Japan)":10102,
}
CHI_PDF = {
 "N. Virginia":913,"Ohio":441,"Oregon":2707,"Montreal":1198,"Dublin (Ireland)":5890,"London (UK)":6353,
 "Frankfurt (Germany)":6977,"Milan (Italy)":7290,"Zurich (Switzerland)":7126,"Paris (France)":6650,
 "Stockholm (Sweden)":6880,"Tokyo (Japan)":10141,"Seoul (South Korea)":10509,"Melbourne (Australia)":15573,
 "Jakarta (Indonesia)":15799,
}
CHI_VOICE = {
 "Council Bluffs, Iowa":688,"Moncks Corner, S. Carolina":1175,"Ashburn, Virginia":913,
 "Columbus, Ohio":444,"Dallas, Texas":1295,"The Dalles, Oregon":2707,
}
CHI_BG = {"Virginia (serves N. America)":913}
for op,bm in [("prompt",CHI_OPENAI),("video",CHI_OPENAI),("code",CHI_OPENAI),
              ("translate",CHI_GOOGLE),("image",CHI_GOOGLE),("pdf",CHI_PDF),
              ("voice",CHI_VOICE),("background",CHI_BG)]:
    assign("Chicago",op,bm)

# ----- SAO PAULO distance maps -----
SAO_OPENAI = {
 "Virginia":7664,"Iowa":8709,"Illinois":8408,"Texas":8087,"California":10370,"Arizona":9384,
 "Quebec City":8204,"Toronto":8186,"Sao Paulo":0,"Stockholm":10927,"Paris":9402,"Frankfurt":9844,
 "Milan":9520,"Netherlands":9805,"Oslo":10633,"Zurich":9622,"Madrid":8385,"London":9498,
 "Tokyo":18537,"Osaka":18759,"Seoul":18342,"New South Wales":13357,"Pune":13856,"Chennai":14322,
 "Mumbai":13774,"Dubai":12226,"Johannesburg":7430,
}
SAO_GOOGLE = {
 "Central Ohio":8009,"Council Bluffs (Iowa)":8812,"The Dalles (Oregon)":10739,"Storey County (Nevada)":10284,
 "Henderson (Nevada)":9763,"Douglas County (Georgia)":7536,"The Lowcountry (S. Carolina)":7235,
 "Lenoir (N. Carolina)":7562,"Jackson County (Alabama)":7700,"Indiana":8147,"Papillion (Nebraska)":8814,
 "Omaha (Nebraska)":8817,"Northern Virginia":7664,"Montgomery County (Tenn.)":7927,"Midlothian (Texas)":8207,
 "Mayes County (Oklahoma)":8385,"Dublin (Ireland)":9393,"Hamina (Finland)":11438,"Fredericia (Denmark)":10278,
 "Eemshaven (Netherlands)":9981,"Hanau (Germany)":9844,"Singapore":15987,"Changhua County (Taiwan)":18705,
 "Inzai City (Japan)":18502,
}
SAO_PDF = {
 "N. Virginia":7664,"Ohio":8009,"Oregon":10739,"Montreal":8147,"Dublin (Ireland)":9393,"London (UK)":9498,
 "Frankfurt (Germany)":9844,"Milan (Italy)":9520,"Zurich (Switzerland)":9622,"Paris (France)":9402,
 "Stockholm (Sweden)":10927,"Tokyo (Japan)":18537,"Seoul (South Korea)":18342,"Melbourne (Australia)":13085,
 "Jakarta (Indonesia)":15629,
}
SAO_VOICE = {
 "Council Bluffs, Iowa":8812,"Moncks Corner, S. Carolina":7234,"Ashburn, Virginia":7664,
 "Columbus, Ohio":8004,"Dallas, Texas":8217,"The Dalles, Oregon":10739,
}
SAO_BG = {"Virginia (serves N. America)":7664}
for op,bm in [("prompt",SAO_OPENAI),("video",SAO_OPENAI),("code",SAO_OPENAI),
              ("translate",SAO_GOOGLE),("image",SAO_GOOGLE),("pdf",SAO_PDF),
              ("voice",SAO_VOICE),("background",SAO_BG)]:
    assign("SaoPaulo",op,bm)

# ---------------------------------------------------------------------------
# 5. BUILD THE NESTED STRUCTURE
# ---------------------------------------------------------------------------
def r1(x):  # round to 1 decimal
    return round(x, 1)
def r2(x):
    return round(x, 2)

out = {"_meta": {
    "description": "AI for All exhibit lookup. city -> operations -> {label, showGroups, min/max by CO2}",
    "totals_units": {"electricity_kWh":"kWh", "co2_kg":"kg", "water_L":"L", "distance_km":"km (origin city -> destination data center, great-circle)"},
    "buildingHours_units": "hours of that building's operation, by metric (elec/co2/water)",
    "min_max_note": "min = destination with lowest CO2; max = destination with highest CO2. Since the exact data center is unknown, these bound the possible impact.",
    "showGroups_note": "primary + secondary together cover all 8 buildings with no overlap; light up primary by default, secondary as the alternate combination",
    "buildings_all": list(BUILDING_ELEC.keys()),
    "building_hourly_rates_note": "co2 & water rates are per-city (home grid); electricity is grid-independent",
    "grid_factors_per_city": {c:{"co2_g_per_kWh":v[0],"water_L_per_kWh":v[1]} for c,v in CITY_GRID.items()},
}}

def make_entry(dest, e_pu, c_pu_g, w_pu_ml, N, rates, city, op):
    elec = e_pu * N
    co2  = (c_pu_g * N) / 1000.0
    water= (w_pu_ml * N) / 1000.0
    bh = {}
    for b in BUILDING_ELEC:
        bh[b] = {
            "elec":  r1(elec / rates[b]["elec"]),
            "co2":   r1(co2  / rates[b]["co2"]),
            "water": r1(water/ rates[b]["water"]),
        }
    return {
        "destination":     dest,
        "distance_km":     DIST[city].get(op, {}).get(dest),
        "electricity_kWh": r1(elec),
        "co2_kg":          r1(co2),
        "water_L":         r1(water),
        "buildingHours":   bh,
    }

for city in AI_USERS:
    N = AI_USERS[city]
    rates = building_rates(city)
    cityblock = {"label": CITY_LABEL[city], "aiUsers": N, "operations": {}}
    for op, meta in OPERATIONS.items():
        if op not in PERUSER[city]:
            continue
        dests = PERUSER[city][op]
        if len(dests) == 1:
            only_dest = list(dests.keys())[0]
            e_pu, c_pu_g, w_pu_ml = dests[only_dest]
            entry = make_entry(only_dest, e_pu, c_pu_g, w_pu_ml, N, rates, city, op)
            opblock = {"label": meta["label"],
                       "showGroups": {"primary": meta["primary"], "secondary": meta["secondary"]},
                       "min": entry, "max": entry}
        else:
            min_dest = min(dests.keys(), key=lambda d: dests[d][1])
            max_dest = max(dests.keys(), key=lambda d: dests[d][1])
            e_min, c_min, w_min = dests[min_dest]
            e_max, c_max, w_max = dests[max_dest]
            opblock = {"label": meta["label"],
                       "showGroups": {"primary": meta["primary"], "secondary": meta["secondary"]},
                       "min": make_entry(min_dest, e_min, c_min, w_min, N, rates, city, op),
                       "max": make_entry(max_dest, e_max, c_max, w_max, N, rates, city, op)}
        cityblock["operations"][op] = opblock
    out[city] = cityblock

import os
outpath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exhibit_data.json")
with open(outpath, "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

ncities = len(AI_USERS)
nops = sum(len(out[c]["operations"]) for c in AI_USERS)
print(f"cities={ncities} operations(total)={nops}")
print(f"written: {outpath}")
