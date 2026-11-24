#!/usr/bin/env python3
"""Собирает data/brands.json из таблицы «Brendli» (Центр сертификации туристских услуг).
Запуск: python3 tools/build_brands.py путь/к/Brendli.xlsx
Названия приводятся к нормальному написанию, город — по отелю (см. CITY)."""
import json, re, sys
import openpyxl

NET = {
 'WYNDHAM HOTELS AND RESORTS': 'Wyndham Hotels & Resorts', 'HILTON': 'Hilton', 'REIKARTZ': 'Reikartz', 'ACCOR': 'Accor',
 'IHG HOTELS AND RESORTS': 'IHG Hotels & Resorts', 'RADISSON HOTEL GROUP': 'Radisson Hotel Group', 'HYATT': 'Hyatt',
 'MARRIOT INTERNATIONAL': 'Marriott International', 'LOTTE HOTELS AND RESORTS': 'Lotte Hotels & Resorts',
 'AZIMUT HOTELS': 'Azimut Hotels', 'MINYOUN HOSPITALITY GROUP': 'Minyoun Hospitality Group', 'SAHID HOTELS AND RESORTS': 'Sahid Hotels & Resorts'}
BRAND = {
 'WYNDHAM': 'Wyndham', 'WYNDHAM GARDEN': 'Wyndham Garden', 'RAMADA BY WYNDHAM': 'Ramada by Wyndham', 'RAMADA ENCORE BY WYNDHAM': 'Ramada Encore by Wyndham',
 'RAMADA PLAZA BY WYNDHAM': 'Ramada Plaza by Wyndham', 'TRYP BY WYNDHAM': 'TRYP by Wyndham', 'RAMADA': 'Ramada',
 'HILTON': 'Hilton', 'HILTON GARDEN INN': 'Hilton Garden Inn', 'HAMPTON BY HILTON': 'Hampton by Hilton', 'DOUBLE TREE BY HILTON': 'DoubleTree by Hilton',
 'REIKARTZ': 'Reikartz', 'MERCURE': 'Mercure', 'IBIS': 'ibis', 'SWISSOTEL': 'Swissôtel', 'MOVENPICK': 'Mövenpick',
 'INTERCONTINENTAL': 'InterContinental', 'CROWNE PLAZA': 'Crowne Plaza', 'HOLIDAY INN': 'Holiday Inn', 'HOTEL INDIGO BY IHG': 'Hotel Indigo',
 'RADISSON BLU': 'Radisson Blu', 'RADISSON INDIVIDUALS': 'Radisson Individuals', 'HYATT REGENCY': 'Hyatt Regency', 'DESTINATION BY HYATT': 'Destination by Hyatt',
 'COURTYARD BY MARRIOTT': 'Courtyard by Marriott', 'JW MARRIOT HOTEL TASHKENT': 'JW Marriott', 'LOTTE CITY HOTEL': 'Lotte City Hotels',
 'AZIMUT': 'Azimut', 'AZIMUT GRAND': 'Azimut Grand', 'MINYOUN': 'Minyoun', 'LIA! BY MINYOUN': 'LIA! by Minyoun', 'SAHID': 'Sahid'}
# Отель → (название для сайта, город). Город уточнён по сайтам сетей там, где его нет в названии.
HOTEL = {
 'WYNDHAM TASHKENT': ('Wyndham Tashkent', 'tashkent'), 'WYNDHAM BUKHARA': ('Wyndham Bukhara', 'bukhara'),
 'WYNDHAM GARDEN CHORVOQ DARVOZASI': ('Wyndham Garden Chorvoq Darvozasi', 'chorvoq'), 'WYNDHAM GARDEN TASHKENT': ('Wyndham Garden Tashkent', 'tashkent'),
 'RAMADA BY WYNDHAM NUKUS': ('Ramada by Wyndham Nukus', 'nukus'), 'RAMADA ENCORE BY WYNDHAM TASHKENT': ('Ramada Encore by Wyndham Tashkent', 'tashkent'),
 'RAMADA ENCORE BY WYNDHAM BUKHARA': ('Ramada Encore by Wyndham Bukhara', 'bukhara'), 'RAMADA PLAZA BY WYNDHAM TASHKENT': ('Ramada Plaza by Wyndham Tashkent', 'tashkent'),
 'TRYP BY WYNDHAM CHIMYON': ('TRYP by Wyndham Chimyon', 'chimgan'), 'TRYP BY WYNDHAM TASHKENT OLYMPIC CITY': ('TRYP by Wyndham Tashkent Olympic City', 'tashkent'),
 'RAMADA': ('Ramada Tashkent', 'tashkent'),
 'HILTON SAMARKAND REGENCY': ('Hilton Samarkand Regency', 'samarkand'), 'HILTON TASHKENT CITY': ('Hilton Tashkent City', 'tashkent'),
 'HILTON GARDEN INN SAMARKAND AFROSIYOB': ('Hilton Garden Inn Samarkand Afrosiyob', 'samarkand'), 'HILTON GARDEN INN SAMARKAND': ('Hilton Garden Inn Samarkand', 'samarkand'),
 'HILTON GARDEN INN SAMARKAND SOGD': ('Hilton Garden Inn Samarkand Sogd', 'samarkand'), 'HILTON GARDEN INN TERMEZ AIRITOM': ('Hilton Garden Inn Termez Airitom', 'termez'),
 'HAMPTON BY HILTON TASHKENT': ('Hampton by Hilton Tashkent', 'tashkent'), 'DOUBLE TREE BY HILTON TASHKENT': ('DoubleTree by Hilton Tashkent', 'tashkent'),
 'REIKARTZ AMAR SAMARKAND': ('Reikartz Amar Samarkand', 'samarkand'), 'REIKARTZ NAMANGAN': ('Reikartz Namangan', 'namangan'), 'REIKARTZ QARSHI': ('Reikartz Qarshi', 'qarshi'),
 'REIKARTZ SOTE': ('Reikartz Sote Tashkent', 'tashkent'), 'HOTEL REIKARTZ KOKAND': ('Reikartz Kokand', 'kokand'), 'REIKARTZ BAHOR BUKHARA': ('Reikartz Bahor Bukhara', 'bukhara'),
 'HOTEL MERIDIAN PLAZA BY REIKARTZ': ('Meridian Plaza by Reikartz', 'samarkand'), 'REIKARTZ FERGANA': ('Reikartz Fergana', 'fergana'),
 'REIKARTZ ABIS': ('Reikartz Abis Tashkent', 'tashkent'), 'REIKARTZ GRAND KOKAND': ('Reikartz Grand Kokand', 'kokand'),
 'MERCURE TASHKENT': ('Mercure Tashkent', 'tashkent'), 'MERCURE TASHKENT NORTH': ('Mercure Tashkent North', 'tashkent'),
 'MERCURE BUKHARA OLD TOWN': ('Mercure Bukhara Old Town', 'bukhara'), 'MERCURE KHIVA': ('Mercure Khiva', 'khiva'), 'IBIS TASHKENT': ('ibis Tashkent', 'tashkent'),
 'SWISSOTEL TASHKENT': ('Swissôtel Tashkent', 'tashkent'), 'MOVENPICK SAMARKAND': ('Mövenpick Samarkand', 'samarkand'),
 'MOVENPICK TASHKENT OLD CITY': ('Mövenpick Tashkent Old City', 'tashkent'),
 'INTERCONTINENTAL TASHKENT': ('InterContinental Tashkent', 'tashkent'), 'CROWNE PLAZA TASHKENT': ('Crowne Plaza Tashkent', 'tashkent'),
 'HOLIDAY INN TASHKENT CITY': ('Holiday Inn Tashkent City', 'tashkent'), 'INDIGO': ('Hotel Indigo Bukhara', 'bukhara'),
 'RADISSON BLU HOTEL TASHKENT': ('Radisson Blu Hotel Tashkent', 'tashkent'),
 'PANARAMS TASHKENT HOTEL, A MEMBER OF RADISSON INDIVIDUALS': ('Panarams Tashkent Hotel, a member of Radisson Individuals', 'tashkent'),
 'HYATT REGENCY TASHKENT': ('Hyatt Regency Tashkent', 'tashkent'), 'BELDERSOY RESORT AND SPA DESTINATION BY HYATT': ('Beldersoy Resort and Spa, Destination by Hyatt', 'beldersay'),
 'COURTYARD BY MARRIOTT': ('Courtyard by Marriott Tashkent', 'tashkent'), 'JW MARRIOT HOTEL TASHKENT': ('JW Marriott Hotel Tashkent', 'tashkent'),
 'LOTTE CITY HOTEL TASHKENT PALACE': ('Lotte City Hotel Tashkent Palace', 'tashkent'), 'AZIMUT': ('Azimut Moderno Hotel Tashkent', 'tashkent'),
 'AZIMUT GRAND HOTEL TASHKENT': ('Azimut Grand Hotel Tashkent', 'tashkent'), 'SILK ROAD BY MINYOUN': ('Silk Road by Minyoun', 'samarkand'),
 'LIA! BY MINYOUN STARS OF ULUGBEK': ('LIA! by Minyoun Stars of Ulugbek', 'samarkand'), 'SAHID ZARAFSHON': ('Sahid Zarafshon', 'bukhara')}
CITY = {  # название, область (regionKey каталога), координаты
 'tashkent': ('Ташкент', 'tashkent', 41.3111, 69.2797), 'samarkand': ('Самарканд', 'samarkand', 39.6542, 66.9597),
 'bukhara': ('Бухара', 'bukhara', 39.7747, 64.4286), 'khiva': ('Хива', 'khorezm', 41.3783, 60.3639),
 'nukus': ('Нукус', 'karakalpakstan', 42.4531, 59.6103), 'termez': ('Термез', 'surkhandarya', 37.2242, 67.2783),
 'namangan': ('Наманган', 'namangan', 40.9983, 71.6726), 'qarshi': ('Карши', 'kashkadarya', 38.8606, 65.7891),
 'kokand': ('Коканд', 'fergana', 40.5286, 70.9425), 'fergana': ('Фергана', 'fergana', 40.3842, 71.7843),
 'chorvoq': ('Чарвак', 'tashkent-region', 41.6250, 70.0360), 'chimgan': ('Чимган', 'tashkent-region', 41.5420, 70.0160),
 'beldersay': ('Белдерсай', 'tashkent-region', 41.5650, 70.0700)}

LOOK = str.maketrans('АВЕКМНОРСТХаеорсх', 'ABEKMHOPCTXaeopcx')  # кириллица, похожая на латиницу
def key(s): return re.sub(r'\s+', ' ', str(s or '').replace('\n', ' ').translate(LOOK)).strip().upper()
def legal(s):
    s = re.sub(r'\s+', ' ', str(s or '')).strip().lstrip("'")
    return s.replace('“', '«').replace('”', '»').replace('"', '«', 1).replace('"', '»', 1)
def stars(s):
    m = re.match(r'(\d)', str(s or '')); return int(m.group(1)) if m else None

wb = openpyxl.load_workbook(sys.argv[1], data_only=True); ws = wb.active
asof = '2026-11-01'
nets = []; net = None; brand = None
for r in ws.iter_rows(min_row=4, values_only=True):
    a, b, c, d, e, f, g, h, i = (list(r) + [None] * 9)[:9]
    if any(isinstance(x, str) and ('JAMI' in x.upper() or 'UMUMIY' in x.upper()) for x in r): continue  # строки итогов
    if b and key(b) in NET:
        net = {'id': re.sub(r'[^a-z]+', '-', NET[key(b)].lower()).strip('-'), 'name': NET[key(b)], 'brands': []}; nets.append(net); brand = None
    if d and key(d) in BRAND:
        brand = {'name': BRAND[key(d)], 'hotels': []}; net['brands'].append(brand)
    if not f: continue
    name, city = HOTEL[key(f)]
    brand['hotels'].append({'name': name, 'legal': legal(e), 'rooms': int(g), 'places': int(h), 'stars': stars(i), 'city': city})
out = {'asof': asof, 'source': 'Центр сертификации туристских услуг', 'cities': {k: {'name': v[0], 'region': v[1], 'lat': v[2], 'lng': v[3]} for k, v in CITY.items()}, 'networks': nets}
hotels = [h for n in nets for b in n['brands'] for h in b['hotels']]
print(len(nets), sum(len(n['brands']) for n in nets), len(hotels), sum(h['rooms'] for h in hotels), sum(h['places'] for h in hotels))
open('data/brands.json', 'w').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
