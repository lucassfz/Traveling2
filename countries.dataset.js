import { CENTRAL_AMERICA_ENRICHMENT } from './centralAmerica.dataset.js';
import { SOUTH_AMERICA_ENRICHMENT } from './southAmerica.dataset.js';

/**
 * Traveling country data.
 * Stable catalog metadata and curated editorial records are intentionally isolated
 * from rendering/business logic. Dynamic visa/health/pricing facts remain labeled
 * as estimates or "confirmar" in the UI.
 */

export const CONTINENT_LABELS = Object.freeze({
  "EU": "Europa",
  "NA": "América do Norte",
  "SA": "América do Sul",
  "AF": "África",
  "AS": "Ásia",
  "OC": "Oceania"
});

export const WORLD_KEY_MAP = Object.freeze({
  "Antigua and Barbuda": "Antigua & Barbuda",
  "Myanmar": "Myanmar (Burma)",
  "Saint Kitts and Nevis": "St. Kitts & Nevis",
  "Saint Lucia": "St. Lucia",
  "Saint Vincent and the Grenadines": "St. Vincent & Grenadines",
  "Sao Tome and Principe": "São Tomé & Príncipe",
  "Solomon Is.": "Solomon Islands",
  "Trinidad and Tobago": "Trinidad & Tobago",
  "Turkey": "Türkiye",
  "Greenland": "Denmark",
  "Fr. Guiana": "Fr. Guiana"
});

export const WORLD_ID_TO_NAME = Object.freeze({
  "4": "Afghanistan",
  "8": "Albania",
  "10": "Antarctica",
  "12": "Algeria",
  "24": "Angola",
  "31": "Azerbaijan",
  "32": "Argentina",
  "36": "Australia",
  "40": "Austria",
  "50": "Bangladesh",
  "51": "Armenia",
  "56": "Belgium",
  "64": "Bhutan",
  "68": "Bolivia",
  "70": "Bosnia and Herz.",
  "76": "Brazil",
  "100": "Bulgaria",
  "108": "Burundi",
  "116": "Cambodia",
  "120": "Cameroon",
  "124": "Canada",
  "140": "Central African Rep.",
  "144": "Sri Lanka",
  "148": "Chad",
  "152": "Chile",
  "156": "China",
  "170": "Colombia",
  "174": "Comoros",
  "178": "Congo",
  "180": "D.R. Congo",
  "188": "Costa Rica",
  "191": "Croatia",
  "192": "Cuba",
  "196": "Cyprus",
  "203": "Czech Rep.",
  "204": "Benin",
  "208": "Denmark",
  "214": "Dominican Rep.",
  "218": "Ecuador",
  "222": "El Salvador",
  "226": "Eq. Guinea",
  "231": "Ethiopia",
  "232": "Eritrea",
  "233": "Estonia",
  "246": "Finland",
  "250": "France",
  "254": "Fr. Guiana",
  "262": "Djibouti",
  "266": "Gabon",
  "268": "Georgia",
  "276": "Germany",
  "288": "Ghana",
  "300": "Greece",
  "304": "Greenland",
  "320": "Guatemala",
  "324": "Guinea",
  "328": "Guyana",
  "332": "Haiti",
  "340": "Honduras",
  "348": "Hungary",
  "352": "Iceland",
  "356": "India",
  "360": "Indonesia",
  "364": "Iran",
  "368": "Iraq",
  "372": "Ireland",
  "376": "Israel",
  "380": "Italy",
  "388": "Jamaica",
  "398": "Kazakhstan",
  "400": "Jordan",
  "404": "Kenya",
  "408": "N. Korea",
  "410": "South Korea",
  "414": "Kuwait",
  "418": "Laos",
  "422": "Lebanon",
  "426": "Lesotho",
  "428": "Latvia",
  "430": "Liberia",
  "434": "Libya",
  "440": "Lithuania",
  "442": "Luxembourg",
  "450": "Madagascar",
  "454": "Malawi",
  "458": "Malaysia",
  "466": "Mali",
  "478": "Mauritania",
  "484": "Mexico",
  "496": "Mongolia",
  "498": "Moldova",
  "499": "Montenegro",
  "504": "Morocco",
  "508": "Mozambique",
  "516": "Namibia",
  "524": "Nepal",
  "528": "Netherlands",
  "554": "New Zealand",
  "558": "Nicaragua",
  "562": "Niger",
  "566": "Nigeria",
  "578": "Norway",
  "586": "Pakistan",
  "591": "Panama",
  "598": "Papua New Guinea",
  "600": "Paraguay",
  "604": "Peru",
  "608": "Philippines",
  "616": "Poland",
  "620": "Portugal",
  "634": "Qatar",
  "642": "Romania",
  "643": "Russia",
  "646": "Rwanda",
  "682": "Saudi Arabia",
  "686": "Senegal",
  "688": "Serbia",
  "694": "Sierra Leone",
  "703": "Slovakia",
  "704": "Vietnam",
  "705": "Slovenia",
  "706": "Somalia",
  "710": "South Africa",
  "716": "Zimbabwe",
  "724": "Spain",
  "729": "S. Sudan",
  "736": "Sudan",
  "740": "Suriname",
  "748": "Swaziland",
  "752": "Sweden",
  "756": "Switzerland",
  "760": "Syria",
  "762": "Tajikistan",
  "764": "Thailand",
  "768": "Togo",
  "780": "Trinidad and Tobago",
  "784": "United Arab Emirates",
  "788": "Tunisia",
  "792": "Turkey",
  "795": "Turkmenistan",
  "800": "Uganda",
  "804": "Ukraine",
  "807": "Macedonia",
  "818": "Egypt",
  "826": "United Kingdom",
  "834": "Tanzania",
  "840": "United States of America",
  "854": "Burkina Faso",
  "858": "Uruguay",
  "860": "Uzbekistan",
  "862": "Venezuela",
  "887": "Yemen",
  "894": "Zambia",
  "20": "Andorra",
  "28": "Antigua and Barbuda",
  "44": "Bahamas",
  "48": "Bahrain",
  "52": "Barbados",
  "72": "Botswana",
  "84": "Belize",
  "90": "Solomon Is.",
  "96": "Brunei",
  "104": "Myanmar",
  "132": "Cape Verde",
  "212": "Dominica",
  "242": "Fiji",
  "270": "Gambia",
  "296": "Kiribati",
  "308": "Grenada",
  "384": "Ivory Coast",
  "417": "Kyrgyzstan",
  "438": "Liechtenstein",
  "462": "Maldives",
  "470": "Malta",
  "480": "Mauritius",
  "492": "Monaco",
  "512": "Oman",
  "520": "Nauru",
  "583": "Micronesia",
  "584": "Marshall Islands",
  "585": "Palau",
  "624": "Guinea-Bissau",
  "626": "Timor-Leste",
  "659": "Saint Kitts and Nevis",
  "662": "Saint Lucia",
  "670": "Saint Vincent and the Grenadines",
  "674": "San Marino",
  "678": "Sao Tome and Principe",
  "690": "Seychelles",
  "702": "Singapore",
  "776": "Tonga",
  "798": "Tuvalu",
  "882": "Samoa"
});

export const COUNTRY_ALIASES = Object.freeze({
  "brasil": "Brazil",
  "estados unidos": "United States of America",
  "eua": "United States of America",
  "estados unidos da america": "United States of America",
  "japao": "Japan",
  "franca": "France",
  "alemanha": "Germany",
  "italia": "Italy",
  "espanha": "Spain",
  "portugal": "Portugal",
  "reino unido": "United Kingdom",
  "inglaterra": "United Kingdom",
  "australia": "Australia",
  "canada": "Canada",
  "mexico": "Mexico",
  "argentina": "Argentina",
  "chile": "Chile",
  "peru": "Peru",
  "colombia": "Colombia",
  "uruguai": "Uruguay",
  "paraguai": "Paraguay",
  "bolivia": "Bolivia",
  "equador": "Ecuador",
  "venezuela": "Venezuela",
  "guiana": "Guyana",
  "guiana francesa": "Fr. Guiana",
  "guiana fr": "Fr. Guiana",
  "suriname": "Suriname",
  "coreia do sul": "South Korea",
  "china": "China",
  "india": "India",
  "russia": "Russia",
  "turquia": "Türkiye",
  "grecia": "Greece",
  "suica": "Switzerland",
  "egito": "Egypt",
  "tailandia": "Thailand",
  "marrocos": "Morocco",
  "africa do sul": "South Africa",
  "nigeria": "Nigeria",
  "quenia": "Kenya",
  "noruega": "Norway",
  "suecia": "Sweden",
  "dinamarca": "Denmark",
  "finlandia": "Finland",
  "polonia": "Poland",
  "hungria": "Hungary",
  "austria": "Austria",
  "belgica": "Belgium",
  "holanda": "Netherlands",
  "paises baixos": "Netherlands",
  "croacia": "Croatia",
  "romenia": "Romania",
  "ucrania": "Ukraine",
  "israel": "Israel",
  "ira": "Iran",
  "arabia saudita": "Saudi Arabia",
  "emirados arabes": "United Arab Emirates",
  "dubai": "United Arab Emirates",
  "nova zelandia": "New Zealand",
  "cazaquistao": "Kazakhstan",
  "mongolia": "Mongolia",
  "nepal": "Nepal",
  "sri lanka": "Sri Lanka",
  "paquistao": "Pakistan",
  "bangladesh": "Bangladesh",
  "laos": "Laos",
  "camboja": "Cambodia",
  "birmania": "Myanmar (Burma)",
  "timor": "Timor-Leste",
  "senegal": "Senegal",
  "ghana": "Ghana",
  "angola": "Angola",
  "mocambique": "Mozambique",
  "madagascar": "Madagascar",
  "zimbabue": "Zimbabwe",
  "zambia": "Zambia",
  "tanzania": "Tanzania",
  "tunisia": "Tunisia",
  "libia": "Libya",
  "argelia": "Algeria",
  "somalia": "Somalia",
  "ruanda": "Rwanda",
  "namibia": "Namibia",
  "lesoto": "Lesotho",
  "suazilandia": "Swaziland",
  "botsuana": "Botswana",
  "camaroes": "Cameroon",
  "mali": "Mali",
  "costa do marfim": "Ivory Coast",
  "burkina faso": "Burkina Faso",
  "guine": "Guinea",
  "benin": "Benin",
  "togo": "Togo",
  "sierra leone": "Sierra Leone",
  "liberia": "Liberia",
  "eritreia": "Eritrea",
  "djibuti": "Djibouti",
  "malawi": "Malawi",
  "cabo verde": "Cape Verde",
  "luxemburgo": "Luxembourg",
  "irlanda": "Ireland",
  "islandia": "Iceland",
  "chipre": "Cyprus",
  "malta": "Malta",
  "albania": "Albania",
  "servia": "Serbia",
  "eslovenia": "Slovenia",
  "eslovaquia": "Slovakia",
  "letonia": "Latvia",
  "lituania": "Lithuania",
  "estonia": "Estonia",
  "bielorrussia": "Belarus",
  "moldova": "Moldova",
  "macedonia": "Macedonia",
  "kosovo": "Kosovo",
  "montenegro": "Montenegro",
  "bosnia": "Bosnia and Herz.",
  "georgia": "Georgia",
  "armenia": "Armenia",
  "azerbaijao": "Azerbaijan",
  "quirguistao": "Kyrgyzstan",
  "tajiquistao": "Tajikistan",
  "turquemenistao": "Turkmenistan",
  "siria": "Syria",
  "iemen": "Yemen",
  "kuwait": "Kuwait",
  "catar": "Qatar",
  "oman": "Oman",
  "oma": "Oman",
  "libano": "Lebanon",
  "jordania": "Jordan",
  "palestina": "Palestine",
  "singapura": "Singapore",
  "brunei": "Brunei",
  "taiwan": "Taiwan",
  "filipinas": "Philippines",
  "maldivas": "Maldives",
  "fiji": "Fiji",
  "cuba": "Cuba",
  "haiti": "Haiti",
  "jamaica": "Jamaica",
  "guatemala": "Guatemala",
  "costa rica": "Costa Rica",
  "panama": "Panama",
  "nicaragua": "Nicaragua",
  "honduras": "Honduras",
  "el salvador": "El Salvador",
  "belize": "Belize",
  "bahamas": "Bahamas",
  "coreia do norte": "N. Korea",
  "papua nova guine": "Papua New Guinea",
  "afeganistao": "Afghanistan",
  "af": "Afghanistan",
  "afghanistan": "Afghanistan",
  "al": "Albania",
  "dz": "Algeria",
  "algeria": "Algeria",
  "andorra": "Andorra",
  "ad": "Andorra",
  "ao": "Angola",
  "antigua e barbuda": "Antigua & Barbuda",
  "ag": "Antigua & Barbuda",
  "antigua & barbuda": "Antigua & Barbuda",
  "ar": "Argentina",
  "am": "Armenia",
  "au": "Australia",
  "at": "Austria",
  "az": "Azerbaijan",
  "azerbaijan": "Azerbaijan",
  "bs": "Bahamas",
  "barein": "Bahrain",
  "bh": "Bahrain",
  "bahrain": "Bahrain",
  "bd": "Bangladesh",
  "barbados": "Barbados",
  "bb": "Barbados",
  "by": "Belarus",
  "belarus": "Belarus",
  "be": "Belgium",
  "belgium": "Belgium",
  "bz": "Belize",
  "bj": "Benin",
  "butao": "Bhutan",
  "bt": "Bhutan",
  "bhutan": "Bhutan",
  "bo": "Bolivia",
  "bosnia e herzegovina": "Bosnia and Herz.",
  "ba": "Bosnia and Herz.",
  "bosnia and herz.": "Bosnia and Herz.",
  "bw": "Botswana",
  "botswana": "Botswana",
  "br": "Brazil",
  "brazil": "Brazil",
  "bn": "Brunei",
  "bulgaria": "Bulgaria",
  "bg": "Bulgaria",
  "burquina faso": "Burkina Faso",
  "bf": "Burkina Faso",
  "burundi": "Burundi",
  "bi": "Burundi",
  "cv": "Cape Verde",
  "cape verde": "Cape Verde",
  "kh": "Cambodia",
  "cambodia": "Cambodia",
  "cm": "Cameroon",
  "cameroon": "Cameroon",
  "ca": "Canada",
  "republica centro-africana": "Central African Rep.",
  "cf": "Central African Rep.",
  "central african rep.": "Central African Rep.",
  "chade": "Chad",
  "td": "Chad",
  "chad": "Chad",
  "cl": "Chile",
  "cn": "China",
  "co": "Colombia",
  "comores": "Comoros",
  "km": "Comoros",
  "comoros": "Comoros",
  "republica do congo": "Congo",
  "cg": "Congo",
  "congo": "Congo",
  "congo - kinshasa": "D.R. Congo",
  "cd": "D.R. Congo",
  "d.r. congo": "D.R. Congo",
  "cr": "Costa Rica",
  "ci": "Ivory Coast",
  "ivory coast": "Ivory Coast",
  "hr": "Croatia",
  "croatia": "Croatia",
  "cu": "Cuba",
  "cy": "Cyprus",
  "cyprus": "Cyprus",
  "tchequia": "Czech Rep.",
  "cz": "Czech Rep.",
  "czech rep.": "Czech Rep.",
  "dk": "Denmark",
  "denmark": "Denmark",
  "dj": "Djibouti",
  "djibouti": "Djibouti",
  "dominica": "Dominica",
  "dm": "Dominica",
  "republica dominicana": "Dominican Rep.",
  "do": "Dominican Rep.",
  "dominican rep.": "Dominican Rep.",
  "ec": "Ecuador",
  "ecuador": "Ecuador",
  "eg": "Egypt",
  "egypt": "Egypt",
  "sv": "El Salvador",
  "guine equatorial": "Eq. Guinea",
  "gq": "Eq. Guinea",
  "eq. guinea": "Eq. Guinea",
  "er": "Eritrea",
  "eritrea": "Eritrea",
  "ee": "Estonia",
  "essuatini": "Swaziland",
  "sz": "Swaziland",
  "swaziland": "Swaziland",
  "etiopia": "Ethiopia",
  "et": "Ethiopia",
  "ethiopia": "Ethiopia",
  "fj": "Fiji",
  "fi": "Finland",
  "finland": "Finland",
  "fr": "France",
  "france": "France",
  "gabao": "Gabon",
  "ga": "Gabon",
  "gabon": "Gabon",
  "gambia": "Gambia",
  "gm": "Gambia",
  "ge": "Georgia",
  "de": "Germany",
  "germany": "Germany",
  "gana": "Ghana",
  "gh": "Ghana",
  "gr": "Greece",
  "greece": "Greece",
  "granada": "Grenada",
  "gd": "Grenada",
  "grenada": "Grenada",
  "gt": "Guatemala",
  "gn": "Guinea",
  "guinea": "Guinea",
  "guine-bissau": "Guinea-Bissau",
  "gw": "Guinea-Bissau",
  "guinea-bissau": "Guinea-Bissau",
  "gy": "Guyana",
  "guyana": "Guyana",
  "ht": "Haiti",
  "hn": "Honduras",
  "hu": "Hungary",
  "hungary": "Hungary",
  "is": "Iceland",
  "iceland": "Iceland",
  "in": "India",
  "indonesia": "Indonesia",
  "id": "Indonesia",
  "ir": "Iran",
  "iran": "Iran",
  "iraque": "Iraq",
  "iq": "Iraq",
  "iraq": "Iraq",
  "ie": "Ireland",
  "ireland": "Ireland",
  "il": "Israel",
  "it": "Italy",
  "italy": "Italy",
  "jm": "Jamaica",
  "jp": "Japan",
  "japan": "Japan",
  "jo": "Jordan",
  "jordan": "Jordan",
  "kz": "Kazakhstan",
  "kazakhstan": "Kazakhstan",
  "ke": "Kenya",
  "kenya": "Kenya",
  "quiribati": "Kiribati",
  "ki": "Kiribati",
  "kiribati": "Kiribati",
  "kp": "N. Korea",
  "n. korea": "N. Korea",
  "kr": "South Korea",
  "south korea": "South Korea",
  "kw": "Kuwait",
  "kg": "Kyrgyzstan",
  "kyrgyzstan": "Kyrgyzstan",
  "la": "Laos",
  "lv": "Latvia",
  "latvia": "Latvia",
  "lb": "Lebanon",
  "lebanon": "Lebanon",
  "ls": "Lesotho",
  "lesotho": "Lesotho",
  "lr": "Liberia",
  "ly": "Libya",
  "libya": "Libya",
  "liechtenstein": "Liechtenstein",
  "li": "Liechtenstein",
  "lt": "Lithuania",
  "lithuania": "Lithuania",
  "lu": "Luxembourg",
  "luxembourg": "Luxembourg",
  "mg": "Madagascar",
  "malaui": "Malawi",
  "mw": "Malawi",
  "malasia": "Malaysia",
  "my": "Malaysia",
  "malaysia": "Malaysia",
  "mv": "Maldives",
  "maldives": "Maldives",
  "ml": "Mali",
  "mt": "Malta",
  "ilhas marshall": "Marshall Islands",
  "mh": "Marshall Islands",
  "marshall islands": "Marshall Islands",
  "mauritania": "Mauritania",
  "mr": "Mauritania",
  "mauricio": "Mauritius",
  "mu": "Mauritius",
  "mauritius": "Mauritius",
  "mx": "Mexico",
  "micronesia": "Micronesia",
  "fm": "Micronesia",
  "moldavia": "Moldova",
  "md": "Moldova",
  "monaco": "Monaco",
  "mc": "Monaco",
  "mn": "Mongolia",
  "me": "Montenegro",
  "ma": "Morocco",
  "morocco": "Morocco",
  "mz": "Mozambique",
  "mozambique": "Mozambique",
  "mianmar (birmania)": "Myanmar (Burma)",
  "mm": "Myanmar (Burma)",
  "myanmar (burma)": "Myanmar (Burma)",
  "na": "Namibia",
  "nauru": "Nauru",
  "nr": "Nauru",
  "np": "Nepal",
  "nl": "Netherlands",
  "netherlands": "Netherlands",
  "nz": "New Zealand",
  "new zealand": "New Zealand",
  "ni": "Nicaragua",
  "niger": "Niger",
  "ne": "Niger",
  "ng": "Nigeria",
  "macedonia do norte": "Macedonia",
  "mk": "Macedonia",
  "no": "Norway",
  "norway": "Norway",
  "om": "Oman",
  "pk": "Pakistan",
  "pakistan": "Pakistan",
  "palau": "Palau",
  "pw": "Palau",
  "pa": "Panama",
  "papua-nova guine": "Papua New Guinea",
  "pg": "Papua New Guinea",
  "papua new guinea": "Papua New Guinea",
  "py": "Paraguay",
  "paraguay": "Paraguay",
  "pe": "Peru",
  "ph": "Philippines",
  "philippines": "Philippines",
  "pl": "Poland",
  "poland": "Poland",
  "pt": "Portugal",
  "qa": "Qatar",
  "qatar": "Qatar",
  "ro": "Romania",
  "romania": "Romania",
  "ru": "Russia",
  "rw": "Rwanda",
  "rwanda": "Rwanda",
  "sao cristovao e nevis": "St. Kitts & Nevis",
  "kn": "St. Kitts & Nevis",
  "st. kitts & nevis": "St. Kitts & Nevis",
  "santa lucia": "St. Lucia",
  "lc": "St. Lucia",
  "st. lucia": "St. Lucia",
  "sao vicente e granadinas": "St. Vincent & Grenadines",
  "vc": "St. Vincent & Grenadines",
  "st. vincent & grenadines": "St. Vincent & Grenadines",
  "samoa": "Samoa",
  "ws": "Samoa",
  "san marino": "San Marino",
  "sm": "San Marino",
  "sao tome e principe": "São Tomé & Príncipe",
  "st": "São Tomé & Príncipe",
  "sao tome & principe": "São Tomé & Príncipe",
  "sa": "Saudi Arabia",
  "saudi arabia": "Saudi Arabia",
  "sn": "Senegal",
  "rs": "Serbia",
  "serbia": "Serbia",
  "seicheles": "Seychelles",
  "sc": "Seychelles",
  "seychelles": "Seychelles",
  "serra leoa": "Sierra Leone",
  "sl": "Sierra Leone",
  "sg": "Singapore",
  "singapore": "Singapore",
  "sk": "Slovakia",
  "slovakia": "Slovakia",
  "si": "Slovenia",
  "slovenia": "Slovenia",
  "ilhas salomao": "Solomon Islands",
  "sb": "Solomon Islands",
  "solomon islands": "Solomon Islands",
  "so": "Somalia",
  "za": "South Africa",
  "south africa": "South Africa",
  "sudao do sul": "S. Sudan",
  "ss": "S. Sudan",
  "s. sudan": "S. Sudan",
  "es": "Spain",
  "spain": "Spain",
  "lk": "Sri Lanka",
  "sudao": "Sudan",
  "sd": "Sudan",
  "sudan": "Sudan",
  "sr": "Suriname",
  "se": "Sweden",
  "sweden": "Sweden",
  "ch": "Switzerland",
  "switzerland": "Switzerland",
  "sy": "Syria",
  "syria": "Syria",
  "tadjiquistao": "Tajikistan",
  "tj": "Tajikistan",
  "tajikistan": "Tajikistan",
  "tz": "Tanzania",
  "th": "Thailand",
  "thailand": "Thailand",
  "timor-leste": "Timor-Leste",
  "tl": "Timor-Leste",
  "tg": "Togo",
  "tonga": "Tonga",
  "to": "Tonga",
  "trinidad e tobago": "Trinidad & Tobago",
  "tt": "Trinidad & Tobago",
  "trinidad & tobago": "Trinidad & Tobago",
  "tn": "Tunisia",
  "tr": "Türkiye",
  "turkiye": "Türkiye",
  "turcomenistao": "Turkmenistan",
  "tm": "Turkmenistan",
  "turkmenistan": "Turkmenistan",
  "tuvalu": "Tuvalu",
  "tv": "Tuvalu",
  "uganda": "Uganda",
  "ug": "Uganda",
  "ua": "Ukraine",
  "ukraine": "Ukraine",
  "emirados arabes unidos": "United Arab Emirates",
  "ae": "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  "gb": "United Kingdom",
  "united kingdom": "United Kingdom",
  "us": "United States of America",
  "united states of america": "United States of America",
  "uy": "Uruguay",
  "uruguay": "Uruguay",
  "uzbequistao": "Uzbekistan",
  "uz": "Uzbekistan",
  "uzbekistan": "Uzbekistan",
  "vanuatu": "Vanuatu",
  "vu": "Vanuatu",
  "ve": "Venezuela",
  "vietna": "Vietnam",
  "vn": "Vietnam",
  "vietnam": "Vietnam",
  "ye": "Yemen",
  "yemen": "Yemen",
  "zm": "Zambia",
  "zw": "Zimbabwe",
  "zimbabwe": "Zimbabwe"
});

export const COUNTRY_CATALOG = Object.freeze({
  "Afghanistan": {
    "alpha2": "AF",
    "namePt": "Afeganistão",
    "flag": "🇦🇫",
    "capital": "Kabul",
    "currencyCode": "AFN",
    "currencyName": "Afegane afegão",
    "symbol": "AFN",
    "languages": [
      "pashto",
      "uzbeque",
      "turcomeno"
    ],
    "timezones": [
      "UTC+04:30"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      33,
      65
    ]
  },
  "Albania": {
    "alpha2": "AL",
    "namePt": "Albânia",
    "flag": "🇦🇱",
    "capital": "Tirana",
    "currencyCode": "ALL",
    "currencyName": "Lek albanês",
    "symbol": "ALL",
    "languages": [
      "albanês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      41,
      20
    ]
  },
  "Algeria": {
    "alpha2": "DZ",
    "namePt": "Argélia",
    "flag": "🇩🇿",
    "capital": "Algiers",
    "currencyCode": "DZD",
    "currencyName": "Dinar argelino",
    "symbol": "DZD",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      28,
      3
    ]
  },
  "Andorra": {
    "alpha2": "AD",
    "namePt": "Andorra",
    "flag": "🇦🇩",
    "capital": "Andorra-a-Velha",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "catalão"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      42.5,
      1.5
    ]
  },
  "Angola": {
    "alpha2": "AO",
    "namePt": "Angola",
    "flag": "🇦🇴",
    "capital": "Luanda",
    "currencyCode": "AOA",
    "currencyName": "Kwanza angolano",
    "symbol": "AOA",
    "languages": [
      "português"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -12.5,
      18.5
    ]
  },
  "Antigua & Barbuda": {
    "alpha2": "AG",
    "namePt": "Antígua e Barbuda",
    "flag": "🇦🇬",
    "capital": "Saint John's",
    "currencyCode": "XCD",
    "currencyName": "Dólar do Caribe Oriental",
    "symbol": "EC$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      17.05,
      -61.8
    ]
  },
  "Argentina": {
    "alpha2": "AR",
    "namePt": "Argentina",
    "flag": "🇦🇷",
    "capital": "Buenos Aires",
    "currencyCode": "ARS",
    "currencyName": "Peso argentino",
    "symbol": "ARS",
    "languages": [
      "espanhol",
      "guarani"
    ],
    "timezones": [
      "UTC−03:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      -34,
      -64
    ]
  },
  "Armenia": {
    "alpha2": "AM",
    "namePt": "Armênia",
    "flag": "🇦🇲",
    "capital": "Yerevan",
    "currencyCode": "AMD",
    "currencyName": "Dram armênio",
    "symbol": "AMD",
    "languages": [
      "armênio",
      "russo"
    ],
    "timezones": [
      "UTC+04:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      40,
      45
    ]
  },
  "Australia": {
    "alpha2": "AU",
    "namePt": "Austrália",
    "flag": "🇦🇺",
    "capital": "Canberra",
    "currencyCode": "AUD",
    "currencyName": "Dólar australiano",
    "symbol": "AU$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+05:00",
      "UTC+06:30",
      "UTC+07:00",
      "UTC+08:00",
      "UTC+09:30",
      "UTC+10:00",
      "UTC+10:30",
      "UTC+11:30"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -27,
      133
    ]
  },
  "Austria": {
    "alpha2": "AT",
    "namePt": "Áustria",
    "flag": "🇦🇹",
    "capital": "Vienna",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "alemão"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      47.33333333,
      13.33333333
    ]
  },
  "Azerbaijan": {
    "alpha2": "AZ",
    "namePt": "Azerbaijão",
    "flag": "🇦🇿",
    "capital": "Baku",
    "currencyCode": "AZN",
    "currencyName": "Manat azeri",
    "symbol": "AZN",
    "languages": [
      "azerbaijano",
      "armênio"
    ],
    "timezones": [
      "UTC+04:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      40.5,
      47.5
    ]
  },
  "Bahamas": {
    "alpha2": "BS",
    "namePt": "Bahamas",
    "flag": "🇧🇸",
    "capital": "Nassau",
    "currencyCode": "BSD",
    "currencyName": "Dólar bahamense",
    "symbol": "BSD",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−05:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      24.25,
      -76
    ]
  },
  "Bahrain": {
    "alpha2": "BH",
    "namePt": "Barein",
    "flag": "🇧🇭",
    "capital": "Manama",
    "currencyCode": "BHD",
    "currencyName": "Dinar bareinita",
    "symbol": "BHD",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      26,
      50.55
    ]
  },
  "Bangladesh": {
    "alpha2": "BD",
    "namePt": "Bangladesh",
    "flag": "🇧🇩",
    "capital": "Dhaka",
    "currencyCode": "BDT",
    "currencyName": "Taka bengali",
    "symbol": "BDT",
    "languages": [
      "bengali"
    ],
    "timezones": [
      "UTC+06:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      24,
      90
    ]
  },
  "Barbados": {
    "alpha2": "BB",
    "namePt": "Barbados",
    "flag": "🇧🇧",
    "capital": "Bridgetown",
    "currencyCode": "BBD",
    "currencyName": "Dólar barbadense",
    "symbol": "BBD",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      13.16666666,
      -59.53333333
    ]
  },
  "Belarus": {
    "alpha2": "BY",
    "namePt": "Bielorrússia",
    "flag": "🇧🇾",
    "capital": "Minsk",
    "currencyCode": "BYR",
    "currencyName": "Rublo bielorrusso (2000–2016)",
    "symbol": "BYR",
    "languages": [
      "bielorrusso",
      "russo"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      53,
      28
    ]
  },
  "Belgium": {
    "alpha2": "BE",
    "namePt": "Bélgica",
    "flag": "🇧🇪",
    "capital": "Brussels",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "holandês",
      "francês",
      "alemão"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      50.83333333,
      4
    ]
  },
  "Belize": {
    "alpha2": "BZ",
    "namePt": "Belize",
    "flag": "🇧🇿",
    "capital": "Belmopan",
    "currencyCode": "BZD",
    "currencyName": "Dólar belizenho",
    "symbol": "BZD",
    "languages": [
      "inglês",
      "espanhol"
    ],
    "timezones": [
      "UTC−06:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      17.25,
      -88.75
    ]
  },
  "Benin": {
    "alpha2": "BJ",
    "namePt": "Benin",
    "flag": "🇧🇯",
    "capital": "Porto-Novo",
    "currencyCode": "XOF",
    "currencyName": "Franco CFA de BCEAO",
    "symbol": "F CFA",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      9.5,
      2.25
    ]
  },
  "Bhutan": {
    "alpha2": "BT",
    "namePt": "Butão",
    "flag": "🇧🇹",
    "capital": "Thimphu",
    "currencyCode": "BTN",
    "currencyName": "Ngultrum butanês",
    "symbol": "BTN",
    "languages": [
      "dzonga"
    ],
    "timezones": [
      "UTC+06:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      27.5,
      90.5
    ]
  },
  "Bolivia": {
    "alpha2": "BO",
    "namePt": "Bolívia",
    "flag": "🇧🇴",
    "capital": "Sucre",
    "currencyCode": "BOB",
    "currencyName": "Boliviano da Bolívia",
    "symbol": "BOB",
    "languages": [
      "espanhol",
      "aimará",
      "quíchua"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      -17,
      -65
    ]
  },
  "Bosnia and Herz.": {
    "alpha2": "BA",
    "namePt": "Bósnia e Herzegovina",
    "flag": "🇧🇦",
    "capital": "Sarajevo",
    "currencyCode": "BAM",
    "currencyName": "Marco conversível da Bósnia e Herzegovina",
    "symbol": "BAM",
    "languages": [
      "bósnio",
      "croata",
      "sérvio"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      44,
      18
    ]
  },
  "Botswana": {
    "alpha2": "BW",
    "namePt": "Botsuana",
    "flag": "🇧🇼",
    "capital": "Gaborone",
    "currencyCode": "BWP",
    "currencyName": "Pula botsuanesa",
    "symbol": "BWP",
    "languages": [
      "inglês",
      "tswana"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -22,
      24
    ]
  },
  "Brazil": {
    "alpha2": "BR",
    "namePt": "Brasil",
    "flag": "🇧🇷",
    "capital": "Brasília",
    "currencyCode": "BRL",
    "currencyName": "Real brasileiro",
    "symbol": "R$",
    "languages": [
      "português"
    ],
    "timezones": [
      "UTC−05:00",
      "UTC−04:00",
      "UTC−03:00",
      "UTC−02:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      -10,
      -55
    ]
  },
  "Brunei": {
    "alpha2": "BN",
    "namePt": "Brunei",
    "flag": "🇧🇳",
    "capital": "Bandar Seri Begawan",
    "currencyCode": "BND",
    "currencyName": "Dólar bruneano",
    "symbol": "BND",
    "languages": [
      "malaio"
    ],
    "timezones": [
      "UTC+08:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      4.5,
      114.66666666
    ]
  },
  "Bulgaria": {
    "alpha2": "BG",
    "namePt": "Bulgária",
    "flag": "🇧🇬",
    "capital": "Sofia",
    "currencyCode": "BGN",
    "currencyName": "Lev búlgaro",
    "symbol": "BGN",
    "languages": [
      "búlgaro"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      43,
      25
    ]
  },
  "Burkina Faso": {
    "alpha2": "BF",
    "namePt": "Burquina Faso",
    "flag": "🇧🇫",
    "capital": "Ouagadougou",
    "currencyCode": "XOF",
    "currencyName": "Franco CFA de BCEAO",
    "symbol": "F CFA",
    "languages": [
      "francês",
      "fula"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      13,
      -2
    ]
  },
  "Burundi": {
    "alpha2": "BI",
    "namePt": "Burundi",
    "flag": "🇧🇮",
    "capital": "Bujumbura",
    "currencyCode": "BIF",
    "currencyName": "Franco burundiano",
    "symbol": "BIF",
    "languages": [
      "francês",
      "rundi"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -3.5,
      30
    ]
  },
  "Cape Verde": {
    "alpha2": "CV",
    "namePt": "Cabo Verde",
    "flag": "🇨🇻",
    "capital": "Praia",
    "currencyCode": "CVE",
    "currencyName": "Escudo cabo-verdiano",
    "symbol": "CVE",
    "languages": [
      "português"
    ],
    "timezones": [
      "UTC−01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      16,
      -24
    ]
  },
  "Cambodia": {
    "alpha2": "KH",
    "namePt": "Camboja",
    "flag": "🇰🇭",
    "capital": "Phnom Penh",
    "currencyCode": "KHR",
    "currencyName": "Riel cambojano",
    "symbol": "KHR",
    "languages": [
      "khmer"
    ],
    "timezones": [
      "UTC+07:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      13,
      105
    ]
  },
  "Cameroon": {
    "alpha2": "CM",
    "namePt": "Camarões",
    "flag": "🇨🇲",
    "capital": "Yaoundé",
    "currencyCode": "XAF",
    "currencyName": "Franco CFA de BEAC",
    "symbol": "FCFA",
    "languages": [
      "inglês",
      "francês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      6,
      12
    ]
  },
  "Canada": {
    "alpha2": "CA",
    "namePt": "Canadá",
    "flag": "🇨🇦",
    "capital": "Ottawa",
    "currencyCode": "CAD",
    "currencyName": "Dólar canadense",
    "symbol": "CA$",
    "languages": [
      "inglês",
      "francês"
    ],
    "timezones": [
      "UTC−08:00",
      "UTC−07:00",
      "UTC−06:00",
      "UTC−05:00",
      "UTC−04:00",
      "UTC−03:30"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      60,
      -95
    ]
  },
  "Central African Rep.": {
    "alpha2": "CF",
    "namePt": "República Centro-Africana",
    "flag": "🇨🇫",
    "capital": "Bangui",
    "currencyCode": "XAF",
    "currencyName": "Franco CFA de BEAC",
    "symbol": "FCFA",
    "languages": [
      "francês",
      "sango"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      7,
      21
    ]
  },
  "Chad": {
    "alpha2": "TD",
    "namePt": "Chade",
    "flag": "🇹🇩",
    "capital": "N'Djamena",
    "currencyCode": "XAF",
    "currencyName": "Franco CFA de BEAC",
    "symbol": "FCFA",
    "languages": [
      "francês",
      "árabe"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      15,
      19
    ]
  },
  "Chile": {
    "alpha2": "CL",
    "namePt": "Chile",
    "flag": "🇨🇱",
    "capital": "Santiago",
    "currencyCode": "CLF",
    "currencyName": "Unidades de Fomento chilenas",
    "symbol": "CLF",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−06:00",
      "UTC−04:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      -30,
      -71
    ]
  },
  "China": {
    "alpha2": "CN",
    "namePt": "China",
    "flag": "🇨🇳",
    "capital": "Beijing",
    "currencyCode": "CNY",
    "currencyName": "Yuan chinês",
    "symbol": "CN¥",
    "languages": [
      "chinês"
    ],
    "timezones": [
      "UTC+08:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      35,
      105
    ]
  },
  "Colombia": {
    "alpha2": "CO",
    "namePt": "Colômbia",
    "flag": "🇨🇴",
    "capital": "Bogotá",
    "currencyCode": "COP",
    "currencyName": "Peso colombiano",
    "symbol": "COP",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−05:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      4,
      -72
    ]
  },
  "Comoros": {
    "alpha2": "KM",
    "namePt": "Comores",
    "flag": "🇰🇲",
    "capital": "Moroni",
    "currencyCode": "KMF",
    "currencyName": "Franco comoriano",
    "symbol": "KMF",
    "languages": [
      "árabe",
      "francês"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -12.16666666,
      44.25
    ]
  },
  "Congo": {
    "alpha2": "CG",
    "namePt": "República do Congo",
    "flag": "🇨🇬",
    "capital": "Brazzaville",
    "currencyCode": "XAF",
    "currencyName": "Franco CFA de BEAC",
    "symbol": "FCFA",
    "languages": [
      "francês",
      "lingala"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -1,
      15
    ]
  },
  "D.R. Congo": {
    "alpha2": "CD",
    "namePt": "Congo - Kinshasa",
    "flag": "🇨🇩",
    "capital": "Kinshasa",
    "currencyCode": "CDF",
    "currencyName": "Franco congolês",
    "symbol": "CDF",
    "languages": [
      "francês",
      "lingala",
      "congolês",
      "suaíli",
      "luba-catanga"
    ],
    "timezones": [
      "UTC+01:00",
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      0,
      25
    ]
  },
  "Costa Rica": {
    "alpha2": "CR",
    "namePt": "Costa Rica",
    "flag": "🇨🇷",
    "capital": "San José",
    "currencyCode": "CRC",
    "currencyName": "Colón costarriquenho",
    "symbol": "CRC",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−06:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      10,
      -84
    ]
  },
  "Ivory Coast": {
    "alpha2": "CI",
    "namePt": "Costa do Marfim",
    "flag": "🇨🇮",
    "capital": "Yamoussoukro",
    "currencyCode": "XOF",
    "currencyName": "Franco CFA de BCEAO",
    "symbol": "F CFA",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      8,
      -5
    ]
  },
  "Croatia": {
    "alpha2": "HR",
    "namePt": "Croácia",
    "flag": "🇭🇷",
    "capital": "Zagreb",
    "currencyCode": "HRK",
    "currencyName": "Kuna croata",
    "symbol": "HRK",
    "languages": [
      "croata"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      45.16666666,
      15.5
    ]
  },
  "Cuba": {
    "alpha2": "CU",
    "namePt": "Cuba",
    "flag": "🇨🇺",
    "capital": "Havana",
    "currencyCode": "CUC",
    "currencyName": "Peso cubano conversível",
    "symbol": "CUC",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−05:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      21.5,
      -80
    ]
  },
  "Cyprus": {
    "alpha2": "CY",
    "namePt": "Chipre",
    "flag": "🇨🇾",
    "capital": "Nicosia",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "grego",
      "turco",
      "armênio"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      35,
      33
    ]
  },
  "Czech Rep.": {
    "alpha2": "CZ",
    "namePt": "Tchéquia",
    "flag": "🇨🇿",
    "capital": "Prague",
    "currencyCode": "CZK",
    "currencyName": "Coroa tcheca",
    "symbol": "CZK",
    "languages": [
      "tcheco",
      "eslovaco"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      49.75,
      15.5
    ]
  },
  "Denmark": {
    "alpha2": "DK",
    "namePt": "Dinamarca",
    "flag": "🇩🇰",
    "capital": "Copenhagen",
    "currencyCode": "DKK",
    "currencyName": "Coroa dinamarquesa",
    "symbol": "DKK",
    "languages": [
      "dinamarquês"
    ],
    "timezones": [
      "UTC−04:00",
      "UTC−03:00",
      "UTC−01:00",
      "UTC",
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      56,
      10
    ]
  },
  "Djibouti": {
    "alpha2": "DJ",
    "namePt": "Djibuti",
    "flag": "🇩🇯",
    "capital": "Djibouti",
    "currencyCode": "DJF",
    "currencyName": "Franco djiboutiano",
    "symbol": "DJF",
    "languages": [
      "francês",
      "árabe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      11.5,
      43
    ]
  },
  "Dominica": {
    "alpha2": "DM",
    "namePt": "Dominica",
    "flag": "🇩🇲",
    "capital": "Roseau",
    "currencyCode": "XCD",
    "currencyName": "Dólar do Caribe Oriental",
    "symbol": "EC$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      15.41666666,
      -61.33333333
    ]
  },
  "Dominican Rep.": {
    "alpha2": "DO",
    "namePt": "República Dominicana",
    "flag": "🇩🇴",
    "capital": "Santo Domingo",
    "currencyCode": "DOP",
    "currencyName": "Peso dominicano",
    "symbol": "DOP",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      19,
      -70.66666666
    ]
  },
  "Ecuador": {
    "alpha2": "EC",
    "namePt": "Equador",
    "flag": "🇪🇨",
    "capital": "Quito",
    "currencyCode": "USD",
    "currencyName": "Dólar americano",
    "symbol": "US$",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−06:00",
      "UTC−05:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      -2,
      -77.5
    ]
  },
  "Egypt": {
    "alpha2": "EG",
    "namePt": "Egito",
    "flag": "🇪🇬",
    "capital": "Cairo",
    "currencyCode": "EGP",
    "currencyName": "Libra egípcia",
    "symbol": "EGP",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      27,
      30
    ]
  },
  "El Salvador": {
    "alpha2": "SV",
    "namePt": "El Salvador",
    "flag": "🇸🇻",
    "capital": "San Salvador",
    "currencyCode": "SVC",
    "currencyName": "Colom salvadorenho",
    "symbol": "SVC",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−06:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      13.83333333,
      -88.91666666
    ]
  },
  "Eq. Guinea": {
    "alpha2": "GQ",
    "namePt": "Guiné Equatorial",
    "flag": "🇬🇶",
    "capital": "Malabo",
    "currencyCode": "XAF",
    "currencyName": "Franco CFA de BEAC",
    "symbol": "FCFA",
    "languages": [
      "espanhol",
      "francês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      2,
      10
    ]
  },
  "Eritrea": {
    "alpha2": "ER",
    "namePt": "Eritreia",
    "flag": "🇪🇷",
    "capital": "Asmara",
    "currencyCode": "ERN",
    "currencyName": "Nakfa da Eritreia",
    "symbol": "ERN",
    "languages": [
      "tigrínia",
      "árabe",
      "inglês"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      15,
      39
    ]
  },
  "Estonia": {
    "alpha2": "EE",
    "namePt": "Estônia",
    "flag": "🇪🇪",
    "capital": "Tallinn",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "estoniano"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      59,
      26
    ]
  },
  "Swaziland": {
    "alpha2": "SZ",
    "namePt": "Essuatíni",
    "flag": "🇸🇿",
    "capital": "Lobamba",
    "currencyCode": "SZL",
    "currencyName": "Lilangeni suazi",
    "symbol": "SZL",
    "languages": [
      "inglês",
      "suázi"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -26.5,
      31.5
    ]
  },
  "Ethiopia": {
    "alpha2": "ET",
    "namePt": "Etiópia",
    "flag": "🇪🇹",
    "capital": "Addis Ababa",
    "currencyCode": "ETB",
    "currencyName": "Birr etíope",
    "symbol": "ETB",
    "languages": [
      "amárico"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      8,
      38
    ]
  },
  "Fiji": {
    "alpha2": "FJ",
    "namePt": "Fiji",
    "flag": "🇫🇯",
    "capital": "Suva",
    "currencyCode": "FJD",
    "currencyName": "Dólar fijiano",
    "symbol": "FJD",
    "languages": [
      "inglês",
      "fijiano",
      "híndi",
      "urdu"
    ],
    "timezones": [
      "UTC+12:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -18,
      175
    ]
  },
  "Finland": {
    "alpha2": "FI",
    "namePt": "Finlândia",
    "flag": "🇫🇮",
    "capital": "Helsinki",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "finlandês",
      "sueco"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      64,
      26
    ]
  },
  "France": {
    "alpha2": "FR",
    "namePt": "França",
    "flag": "🇫🇷",
    "capital": "Paris",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC−10:00",
      "UTC−09:30",
      "UTC−09:00",
      "UTC−08:00",
      "UTC−04:00",
      "UTC−03:00",
      "UTC+01:00",
      "UTC+03:00",
      "UTC+04:00",
      "UTC+05:00",
      "UTC+11:00",
      "UTC+12:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      46,
      2
    ]
  },
  "Gabon": {
    "alpha2": "GA",
    "namePt": "Gabão",
    "flag": "🇬🇦",
    "capital": "Libreville",
    "currencyCode": "XAF",
    "currencyName": "Franco CFA de BEAC",
    "symbol": "FCFA",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -1,
      11.75
    ]
  },
  "Gambia": {
    "alpha2": "GM",
    "namePt": "Gâmbia",
    "flag": "🇬🇲",
    "capital": "Banjul",
    "currencyCode": "GMD",
    "currencyName": "Dalasi gambiano",
    "symbol": "GMD",
    "languages": [
      "inglês"
    ],
    "timezones": [],
    "cont": "AF",
    "region": "África",
    "latlng": [
      13.46666666,
      -16.56666666
    ]
  },
  "Georgia": {
    "alpha2": "GE",
    "namePt": "Geórgia",
    "flag": "🇬🇪",
    "capital": "Tbilisi",
    "currencyCode": "GEL",
    "currencyName": "Lari georgiano",
    "symbol": "GEL",
    "languages": [
      "georgiano"
    ],
    "timezones": [],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      42,
      43.5
    ]
  },
  "Germany": {
    "alpha2": "DE",
    "namePt": "Alemanha",
    "flag": "🇩🇪",
    "capital": "Berlin",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "alemão"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      51,
      9
    ]
  },
  "Ghana": {
    "alpha2": "GH",
    "namePt": "Gana",
    "flag": "🇬🇭",
    "capital": "Accra",
    "currencyCode": "GHS",
    "currencyName": "Cedi ganês",
    "symbol": "GHS",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      8,
      -2
    ]
  },
  "Greece": {
    "alpha2": "GR",
    "namePt": "Grécia",
    "flag": "🇬🇷",
    "capital": "Athens",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "grego"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      39,
      22
    ]
  },
  "Grenada": {
    "alpha2": "GD",
    "namePt": "Granada",
    "flag": "🇬🇩",
    "capital": "St. George's",
    "currencyCode": "XCD",
    "currencyName": "Dólar do Caribe Oriental",
    "symbol": "EC$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      12.11666666,
      -61.66666666
    ]
  },
  "Guatemala": {
    "alpha2": "GT",
    "namePt": "Guatemala",
    "flag": "🇬🇹",
    "capital": "Guatemala City",
    "currencyCode": "GTQ",
    "currencyName": "Quetzal guatemalteco",
    "symbol": "GTQ",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−06:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      15.5,
      -90.25
    ]
  },
  "Guinea": {
    "alpha2": "GN",
    "namePt": "Guiné",
    "flag": "🇬🇳",
    "capital": "Conakry",
    "currencyCode": "GNF",
    "currencyName": "Franco guineano",
    "symbol": "GNF",
    "languages": [
      "francês",
      "fula"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      11,
      -10
    ]
  },
  "Guinea-Bissau": {
    "alpha2": "GW",
    "namePt": "Guiné-Bissau",
    "flag": "🇬🇼",
    "capital": "Bissau",
    "currencyCode": "XOF",
    "currencyName": "Franco CFA de BCEAO",
    "symbol": "F CFA",
    "languages": [
      "português"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      12,
      -15
    ]
  },
  "Guyana": {
    "alpha2": "GY",
    "namePt": "Guiana",
    "flag": "🇬🇾",
    "capital": "Georgetown",
    "currencyCode": "GYD",
    "currencyName": "Dólar guianense",
    "symbol": "GYD",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      5,
      -59
    ]
  },
  "Haiti": {
    "alpha2": "HT",
    "namePt": "Haiti",
    "flag": "🇭🇹",
    "capital": "Port-au-Prince",
    "currencyCode": "HTG",
    "currencyName": "Gourde haitiano",
    "symbol": "HTG",
    "languages": [
      "francês",
      "haitiano"
    ],
    "timezones": [
      "UTC−05:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      19,
      -72.41666666
    ]
  },
  "Honduras": {
    "alpha2": "HN",
    "namePt": "Honduras",
    "flag": "🇭🇳",
    "capital": "Tegucigalpa",
    "currencyCode": "HNL",
    "currencyName": "Lempira hondurenha",
    "symbol": "HNL",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−06:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      15,
      -86.5
    ]
  },
  "Hungary": {
    "alpha2": "HU",
    "namePt": "Hungria",
    "flag": "🇭🇺",
    "capital": "Budapest",
    "currencyCode": "HUF",
    "currencyName": "Florim húngaro",
    "symbol": "HUF",
    "languages": [
      "húngaro"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      47,
      20
    ]
  },
  "Iceland": {
    "alpha2": "IS",
    "namePt": "Islândia",
    "flag": "🇮🇸",
    "capital": "Reykjavik",
    "currencyCode": "ISK",
    "currencyName": "Coroa islandesa",
    "symbol": "ISK",
    "languages": [
      "islandês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      65,
      -18
    ]
  },
  "India": {
    "alpha2": "IN",
    "namePt": "Índia",
    "flag": "🇮🇳",
    "capital": "New Delhi",
    "currencyCode": "INR",
    "currencyName": "Rupia indiana",
    "symbol": "₹",
    "languages": [
      "híndi",
      "inglês"
    ],
    "timezones": [
      "UTC+05:30"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      20,
      77
    ]
  },
  "Indonesia": {
    "alpha2": "ID",
    "namePt": "Indonésia",
    "flag": "🇮🇩",
    "capital": "Jakarta",
    "currencyCode": "IDR",
    "currencyName": "Rupia indonésia",
    "symbol": "IDR",
    "languages": [
      "indonésio"
    ],
    "timezones": [
      "UTC+07:00",
      "UTC+08:00",
      "UTC+09:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      -5,
      120
    ]
  },
  "Iran": {
    "alpha2": "IR",
    "namePt": "Irã",
    "flag": "🇮🇷",
    "capital": "Tehran",
    "currencyCode": "IRR",
    "currencyName": "Rial iraniano",
    "symbol": "IRR",
    "languages": [
      "persa"
    ],
    "timezones": [
      "UTC+03:30"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      32,
      53
    ]
  },
  "Iraq": {
    "alpha2": "IQ",
    "namePt": "Iraque",
    "flag": "🇮🇶",
    "capital": "Baghdad",
    "currencyCode": "IQD",
    "currencyName": "Dinar iraquiano",
    "symbol": "IQD",
    "languages": [
      "árabe",
      "curdo"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      33,
      44
    ]
  },
  "Ireland": {
    "alpha2": "IE",
    "namePt": "Irlanda",
    "flag": "🇮🇪",
    "capital": "Dublin",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "irlandês",
      "inglês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      53,
      -8
    ]
  },
  "Israel": {
    "alpha2": "IL",
    "namePt": "Israel",
    "flag": "🇮🇱",
    "capital": "Jerusalem",
    "currencyCode": "ILS",
    "currencyName": "Novo shekel israelense",
    "symbol": "₪",
    "languages": [
      "hebraico",
      "árabe"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      31.5,
      34.75
    ]
  },
  "Italy": {
    "alpha2": "IT",
    "namePt": "Itália",
    "flag": "🇮🇹",
    "capital": "Rome",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "italiano"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      42.83333333,
      12.83333333
    ]
  },
  "Jamaica": {
    "alpha2": "JM",
    "namePt": "Jamaica",
    "flag": "🇯🇲",
    "capital": "Kingston",
    "currencyCode": "JMD",
    "currencyName": "Dólar jamaicano",
    "symbol": "JMD",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−05:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      18.25,
      -77.5
    ]
  },
  "Japan": {
    "alpha2": "JP",
    "namePt": "Japão",
    "flag": "🇯🇵",
    "capital": "Tokyo",
    "currencyCode": "JPY",
    "currencyName": "Iene japonês",
    "symbol": "JP¥",
    "languages": [
      "japonês"
    ],
    "timezones": [
      "UTC+09:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      36,
      138
    ]
  },
  "Jordan": {
    "alpha2": "JO",
    "namePt": "Jordânia",
    "flag": "🇯🇴",
    "capital": "Amman",
    "currencyCode": "JOD",
    "currencyName": "Dinar jordaniano",
    "symbol": "JOD",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      31,
      36
    ]
  },
  "Kazakhstan": {
    "alpha2": "KZ",
    "namePt": "Cazaquistão",
    "flag": "🇰🇿",
    "capital": "Astana",
    "currencyCode": "KZT",
    "currencyName": "Tenge cazaque",
    "symbol": "KZT",
    "languages": [
      "cazaque",
      "russo"
    ],
    "timezones": [
      "UTC+05:00",
      "UTC+06:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      48,
      68
    ]
  },
  "Kenya": {
    "alpha2": "KE",
    "namePt": "Quênia",
    "flag": "🇰🇪",
    "capital": "Nairobi",
    "currencyCode": "KES",
    "currencyName": "Xelim queniano",
    "symbol": "KES",
    "languages": [
      "inglês",
      "suaíli"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      1,
      38
    ]
  },
  "Kiribati": {
    "alpha2": "KI",
    "namePt": "Quiribati",
    "flag": "🇰🇮",
    "capital": "South Tarawa",
    "currencyCode": "AUD",
    "currencyName": "Dólar australiano",
    "symbol": "AU$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+12:00",
      "UTC+13:00",
      "UTC+14:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      1.41666666,
      173
    ]
  },
  "N. Korea": {
    "alpha2": "KP",
    "namePt": "Coreia do Norte",
    "flag": "🇰🇵",
    "capital": "Pyongyang",
    "currencyCode": "KPW",
    "currencyName": "Won norte-coreano",
    "symbol": "KPW",
    "languages": [
      "coreano"
    ],
    "timezones": [
      "UTC+09:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      40,
      127
    ]
  },
  "South Korea": {
    "alpha2": "KR",
    "namePt": "Coreia do Sul",
    "flag": "🇰🇷",
    "capital": "Seoul",
    "currencyCode": "KRW",
    "currencyName": "Won sul-coreano",
    "symbol": "₩",
    "languages": [
      "coreano"
    ],
    "timezones": [
      "UTC+09:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      37,
      127.5
    ]
  },
  "Kuwait": {
    "alpha2": "KW",
    "namePt": "Kuwait",
    "flag": "🇰🇼",
    "capital": "Kuwait City",
    "currencyCode": "KWD",
    "currencyName": "Dinar kuwaitiano",
    "symbol": "KWD",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      29.5,
      45.75
    ]
  },
  "Kyrgyzstan": {
    "alpha2": "KG",
    "namePt": "Quirguistão",
    "flag": "🇰🇬",
    "capital": "Bishkek",
    "currencyCode": "KGS",
    "currencyName": "Som quirguiz",
    "symbol": "KGS",
    "languages": [
      "quirguiz",
      "russo"
    ],
    "timezones": [
      "UTC+06:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      41,
      75
    ]
  },
  "Laos": {
    "alpha2": "LA",
    "namePt": "Laos",
    "flag": "🇱🇦",
    "capital": "Vientiane",
    "currencyCode": "LAK",
    "currencyName": "Kip laosiano",
    "symbol": "LAK",
    "languages": [
      "laosiano"
    ],
    "timezones": [
      "UTC+07:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      18,
      105
    ]
  },
  "Latvia": {
    "alpha2": "LV",
    "namePt": "Letônia",
    "flag": "🇱🇻",
    "capital": "Riga",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "letão"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      57,
      25
    ]
  },
  "Lebanon": {
    "alpha2": "LB",
    "namePt": "Líbano",
    "flag": "🇱🇧",
    "capital": "Beirut",
    "currencyCode": "LBP",
    "currencyName": "Libra libanesa",
    "symbol": "LBP",
    "languages": [
      "árabe",
      "francês"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      33.83333333,
      35.83333333
    ]
  },
  "Lesotho": {
    "alpha2": "LS",
    "namePt": "Lesoto",
    "flag": "🇱🇸",
    "capital": "Maseru",
    "currencyCode": "LSL",
    "currencyName": "Loti lesotiano",
    "symbol": "LSL",
    "languages": [
      "inglês",
      "soto do sul"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -29.5,
      28.5
    ]
  },
  "Liberia": {
    "alpha2": "LR",
    "namePt": "Libéria",
    "flag": "🇱🇷",
    "capital": "Monrovia",
    "currencyCode": "LRD",
    "currencyName": "Dólar liberiano",
    "symbol": "LRD",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      6.5,
      -9.5
    ]
  },
  "Libya": {
    "alpha2": "LY",
    "namePt": "Líbia",
    "flag": "🇱🇾",
    "capital": "Tripoli",
    "currencyCode": "LYD",
    "currencyName": "Dinar líbio",
    "symbol": "LYD",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      25,
      17
    ]
  },
  "Liechtenstein": {
    "alpha2": "LI",
    "namePt": "Liechtenstein",
    "flag": "🇱🇮",
    "capital": "Vaduz",
    "currencyCode": "CHF",
    "currencyName": "Franco suíço",
    "symbol": "CHF",
    "languages": [
      "alemão"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      47.26666666,
      9.53333333
    ]
  },
  "Lithuania": {
    "alpha2": "LT",
    "namePt": "Lituânia",
    "flag": "🇱🇹",
    "capital": "Vilnius",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "lituano"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      56,
      24
    ]
  },
  "Luxembourg": {
    "alpha2": "LU",
    "namePt": "Luxemburgo",
    "flag": "🇱🇺",
    "capital": "Luxembourg",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "francês",
      "alemão",
      "luxemburguês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      49.75,
      6.16666666
    ]
  },
  "Madagascar": {
    "alpha2": "MG",
    "namePt": "Madagascar",
    "flag": "🇲🇬",
    "capital": "Antananarivo",
    "currencyCode": "MGA",
    "currencyName": "Ariary malgaxe",
    "symbol": "MGA",
    "languages": [
      "francês",
      "malgaxe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -20,
      47
    ]
  },
  "Malawi": {
    "alpha2": "MW",
    "namePt": "Malaui",
    "flag": "🇲🇼",
    "capital": "Lilongwe",
    "currencyCode": "MWK",
    "currencyName": "Kwacha malauiana",
    "symbol": "MWK",
    "languages": [
      "inglês",
      "nianja"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -13.5,
      34
    ]
  },
  "Malaysia": {
    "alpha2": "MY",
    "namePt": "Malásia",
    "flag": "🇲🇾",
    "capital": "Kuala Lumpur",
    "currencyCode": "MYR",
    "currencyName": "Ringgit malaio",
    "symbol": "MYR",
    "languages": [
      "Consulte o idioma local"
    ],
    "timezones": [
      "UTC+08:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      2.5,
      112.5
    ]
  },
  "Maldives": {
    "alpha2": "MV",
    "namePt": "Maldivas",
    "flag": "🇲🇻",
    "capital": "Malé",
    "currencyCode": "MVR",
    "currencyName": "Rupia maldivana",
    "symbol": "MVR",
    "languages": [
      "divehi"
    ],
    "timezones": [
      "UTC+05:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      3.25,
      73
    ]
  },
  "Mali": {
    "alpha2": "ML",
    "namePt": "Mali",
    "flag": "🇲🇱",
    "capital": "Bamako",
    "currencyCode": "XOF",
    "currencyName": "Franco CFA de BCEAO",
    "symbol": "F CFA",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      17,
      -4
    ]
  },
  "Malta": {
    "alpha2": "MT",
    "namePt": "Malta",
    "flag": "🇲🇹",
    "capital": "Valletta",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "maltês",
      "inglês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      35.83333333,
      14.58333333
    ]
  },
  "Marshall Islands": {
    "alpha2": "MH",
    "namePt": "Ilhas Marshall",
    "flag": "🇲🇭",
    "capital": "Majuro",
    "currencyCode": "USD",
    "currencyName": "Dólar americano",
    "symbol": "US$",
    "languages": [
      "inglês",
      "marshalês"
    ],
    "timezones": [
      "UTC+12:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      9,
      168
    ]
  },
  "Mauritania": {
    "alpha2": "MR",
    "namePt": "Mauritânia",
    "flag": "🇲🇷",
    "capital": "Nouakchott",
    "currencyCode": "MRO",
    "currencyName": "Ouguiya mauritana (1973–2017)",
    "symbol": "MRO",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      20,
      -12
    ]
  },
  "Mauritius": {
    "alpha2": "MU",
    "namePt": "Maurício",
    "flag": "🇲🇺",
    "capital": "Port Louis",
    "currencyCode": "MUR",
    "currencyName": "Rupia mauriciana",
    "symbol": "MUR",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+04:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -20.28333333,
      57.55
    ]
  },
  "Mexico": {
    "alpha2": "MX",
    "namePt": "México",
    "flag": "🇲🇽",
    "capital": "Mexico City",
    "currencyCode": "MXN",
    "currencyName": "Peso mexicano",
    "symbol": "MX$",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−08:00",
      "UTC−07:00",
      "UTC−06:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      23,
      -102
    ]
  },
  "Micronesia": {
    "alpha2": "FM",
    "namePt": "Micronésia",
    "flag": "🇫🇲",
    "capital": "Palikir",
    "currencyCode": "USD",
    "currencyName": "Dólar americano",
    "symbol": "US$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+10:00",
      "UTC+11"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      6.91666666,
      158.25
    ]
  },
  "Moldova": {
    "alpha2": "MD",
    "namePt": "Moldávia",
    "flag": "🇲🇩",
    "capital": "Chișinău",
    "currencyCode": "MDL",
    "currencyName": "Leu moldávio",
    "symbol": "MDL",
    "languages": [
      "romeno"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      47,
      29
    ]
  },
  "Monaco": {
    "alpha2": "MC",
    "namePt": "Mônaco",
    "flag": "🇲🇨",
    "capital": "Monaco",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      43.73333333,
      7.4
    ]
  },
  "Mongolia": {
    "alpha2": "MN",
    "namePt": "Mongólia",
    "flag": "🇲🇳",
    "capital": "Ulan Bator",
    "currencyCode": "MNT",
    "currencyName": "Tugrik mongol",
    "symbol": "MNT",
    "languages": [
      "mongol"
    ],
    "timezones": [
      "UTC+07:00",
      "UTC+08:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      46,
      105
    ]
  },
  "Montenegro": {
    "alpha2": "ME",
    "namePt": "Montenegro",
    "flag": "🇲🇪",
    "capital": "Podgorica",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "sérvio"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      42.5,
      19.3
    ]
  },
  "Morocco": {
    "alpha2": "MA",
    "namePt": "Marrocos",
    "flag": "🇲🇦",
    "capital": "Rabat",
    "currencyCode": "MAD",
    "currencyName": "Dirham marroquino",
    "symbol": "MAD",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      32,
      -5
    ]
  },
  "Mozambique": {
    "alpha2": "MZ",
    "namePt": "Moçambique",
    "flag": "🇲🇿",
    "capital": "Maputo",
    "currencyCode": "MZN",
    "currencyName": "Metical moçambicano",
    "symbol": "MZN",
    "languages": [
      "português"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -18.25,
      35
    ]
  },
  "Myanmar (Burma)": {
    "alpha2": "MM",
    "namePt": "Mianmar (Birmânia)",
    "flag": "🇲🇲",
    "capital": "Naypyidaw",
    "currencyCode": "MMK",
    "currencyName": "Quiate mianmarense",
    "symbol": "MMK",
    "languages": [
      "birmanês"
    ],
    "timezones": [
      "UTC+06:30"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      21.9,
      95.9
    ]
  },
  "Namibia": {
    "alpha2": "NA",
    "namePt": "Namíbia",
    "flag": "🇳🇦",
    "capital": "Windhoek",
    "currencyCode": "NAD",
    "currencyName": "Dólar namibiano",
    "symbol": "NAD",
    "languages": [
      "inglês",
      "africâner"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -22,
      17
    ]
  },
  "Nauru": {
    "alpha2": "NR",
    "namePt": "Nauru",
    "flag": "🇳🇷",
    "capital": "Yaren",
    "currencyCode": "AUD",
    "currencyName": "Dólar australiano",
    "symbol": "AU$",
    "languages": [
      "inglês",
      "nauruano"
    ],
    "timezones": [
      "UTC+12:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -0.53333333,
      166.91666666
    ]
  },
  "Nepal": {
    "alpha2": "NP",
    "namePt": "Nepal",
    "flag": "🇳🇵",
    "capital": "Kathmandu",
    "currencyCode": "NPR",
    "currencyName": "Rupia nepalesa",
    "symbol": "NPR",
    "languages": [
      "nepalês"
    ],
    "timezones": [
      "UTC+05:45"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      28,
      84
    ]
  },
  "Netherlands": {
    "alpha2": "NL",
    "namePt": "Países Baixos",
    "flag": "🇳🇱",
    "capital": "Amsterdam",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "holandês"
    ],
    "timezones": [],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      52.5,
      5.75
    ]
  },
  "New Zealand": {
    "alpha2": "NZ",
    "namePt": "Nova Zelândia",
    "flag": "🇳🇿",
    "capital": "Wellington",
    "currencyCode": "NZD",
    "currencyName": "Dólar neozelandês",
    "symbol": "NZ$",
    "languages": [
      "inglês",
      "maori"
    ],
    "timezones": [
      "UTC−11:00",
      "UTC−10:00",
      "UTC+12:00",
      "UTC+12:45",
      "UTC+13:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -41,
      174
    ]
  },
  "Nicaragua": {
    "alpha2": "NI",
    "namePt": "Nicarágua",
    "flag": "🇳🇮",
    "capital": "Managua",
    "currencyCode": "NIO",
    "currencyName": "Córdoba nicaraguense",
    "symbol": "NIO",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−06:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      13,
      -85
    ]
  },
  "Niger": {
    "alpha2": "NE",
    "namePt": "Níger",
    "flag": "🇳🇪",
    "capital": "Niamey",
    "currencyCode": "XOF",
    "currencyName": "Franco CFA de BCEAO",
    "symbol": "F CFA",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      16,
      8
    ]
  },
  "Nigeria": {
    "alpha2": "NG",
    "namePt": "Nigéria",
    "flag": "🇳🇬",
    "capital": "Abuja",
    "currencyCode": "NGN",
    "currencyName": "Naira nigeriana",
    "symbol": "NGN",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      10,
      8
    ]
  },
  "Macedonia": {
    "alpha2": "MK",
    "namePt": "Macedônia do Norte",
    "flag": "🇲🇰",
    "capital": "Skopje",
    "currencyCode": "MKD",
    "currencyName": "Dinar macedônio",
    "symbol": "MKD",
    "languages": [
      "macedônio"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      41.83333333,
      22
    ]
  },
  "Norway": {
    "alpha2": "NO",
    "namePt": "Noruega",
    "flag": "🇳🇴",
    "capital": "Oslo",
    "currencyCode": "NOK",
    "currencyName": "Coroa norueguesa",
    "symbol": "NOK",
    "languages": [
      "norueguês",
      "bokmål norueguês",
      "nynorsk norueguês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      62,
      10
    ]
  },
  "Oman": {
    "alpha2": "OM",
    "namePt": "Omã",
    "flag": "🇴🇲",
    "capital": "Muscat",
    "currencyCode": "OMR",
    "currencyName": "Rial omanense",
    "symbol": "OMR",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+04:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      21,
      57
    ]
  },
  "Pakistan": {
    "alpha2": "PK",
    "namePt": "Paquistão",
    "flag": "🇵🇰",
    "capital": "Islamabad",
    "currencyCode": "PKR",
    "currencyName": "Rupia paquistanesa",
    "symbol": "PKR",
    "languages": [
      "inglês",
      "urdu"
    ],
    "timezones": [
      "UTC+05:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      30,
      70
    ]
  },
  "Palau": {
    "alpha2": "PW",
    "namePt": "Palau",
    "flag": "🇵🇼",
    "capital": "Ngerulmud",
    "currencyCode": "USD",
    "currencyName": "Dólar americano",
    "symbol": "US$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+09:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      7.5,
      134.5
    ]
  },
  "Panama": {
    "alpha2": "PA",
    "namePt": "Panamá",
    "flag": "🇵🇦",
    "capital": "Panama City",
    "currencyCode": "PAB",
    "currencyName": "Balboa panamenho",
    "symbol": "PAB",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−05:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      9,
      -80
    ]
  },
  "Papua New Guinea": {
    "alpha2": "PG",
    "namePt": "Papua-Nova Guiné",
    "flag": "🇵🇬",
    "capital": "Port Moresby",
    "currencyCode": "PGK",
    "currencyName": "Kina papuásia",
    "symbol": "PGK",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+10:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -6,
      147
    ]
  },
  "Paraguay": {
    "alpha2": "PY",
    "namePt": "Paraguai",
    "flag": "🇵🇾",
    "capital": "Asunción",
    "currencyCode": "PYG",
    "currencyName": "Guarani paraguaio",
    "symbol": "PYG",
    "languages": [
      "espanhol",
      "guarani"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      -23,
      -58
    ]
  },
  "Peru": {
    "alpha2": "PE",
    "namePt": "Peru",
    "flag": "🇵🇪",
    "capital": "Lima",
    "currencyCode": "PEN",
    "currencyName": "Novo sol peruano",
    "symbol": "PEN",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−05:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      -10,
      -76
    ]
  },
  "Philippines": {
    "alpha2": "PH",
    "namePt": "Filipinas",
    "flag": "🇵🇭",
    "capital": "Manila",
    "currencyCode": "PHP",
    "currencyName": "Peso filipino",
    "symbol": "PHP",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+08:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      13,
      122
    ]
  },
  "Poland": {
    "alpha2": "PL",
    "namePt": "Polônia",
    "flag": "🇵🇱",
    "capital": "Warsaw",
    "currencyCode": "PLN",
    "currencyName": "Zloty polonês",
    "symbol": "PLN",
    "languages": [
      "polonês"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      52,
      20
    ]
  },
  "Portugal": {
    "alpha2": "PT",
    "namePt": "Portugal",
    "flag": "🇵🇹",
    "capital": "Lisbon",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "português"
    ],
    "timezones": [
      "UTC−01:00",
      "UTC"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      39.5,
      -8
    ]
  },
  "Qatar": {
    "alpha2": "QA",
    "namePt": "Catar",
    "flag": "🇶🇦",
    "capital": "Doha",
    "currencyCode": "QAR",
    "currencyName": "Rial catariano",
    "symbol": "QAR",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      25.5,
      51.25
    ]
  },
  "Romania": {
    "alpha2": "RO",
    "namePt": "Romênia",
    "flag": "🇷🇴",
    "capital": "Bucharest",
    "currencyCode": "RON",
    "currencyName": "Leu romeno",
    "symbol": "RON",
    "languages": [
      "romeno"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      46,
      25
    ]
  },
  "Russia": {
    "alpha2": "RU",
    "namePt": "Rússia",
    "flag": "🇷🇺",
    "capital": "Moscow",
    "currencyCode": "RUB",
    "currencyName": "Rublo russo",
    "symbol": "RUB",
    "languages": [
      "russo"
    ],
    "timezones": [
      "UTC+03:00",
      "UTC+04:00",
      "UTC+06:00",
      "UTC+07:00",
      "UTC+08:00",
      "UTC+09:00",
      "UTC+10:00",
      "UTC+11:00",
      "UTC+12:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      60,
      100
    ]
  },
  "Rwanda": {
    "alpha2": "RW",
    "namePt": "Ruanda",
    "flag": "🇷🇼",
    "capital": "Kigali",
    "currencyCode": "RWF",
    "currencyName": "Franco ruandês",
    "symbol": "RWF",
    "languages": [
      "quiniaruanda",
      "inglês",
      "francês"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -2,
      30
    ]
  },
  "St. Kitts & Nevis": {
    "alpha2": "KN",
    "namePt": "São Cristóvão e Névis",
    "flag": "🇰🇳",
    "capital": "Basseterre",
    "currencyCode": "XCD",
    "currencyName": "Dólar do Caribe Oriental",
    "symbol": "EC$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      17.33333333,
      -62.75
    ]
  },
  "St. Lucia": {
    "alpha2": "LC",
    "namePt": "Santa Lúcia",
    "flag": "🇱🇨",
    "capital": "Castries",
    "currencyCode": "XCD",
    "currencyName": "Dólar do Caribe Oriental",
    "symbol": "EC$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      13.88333333,
      -60.96666666
    ]
  },
  "St. Vincent & Grenadines": {
    "alpha2": "VC",
    "namePt": "São Vicente e Granadinas",
    "flag": "🇻🇨",
    "capital": "Kingstown",
    "currencyCode": "XCD",
    "currencyName": "Dólar do Caribe Oriental",
    "symbol": "EC$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      13.25,
      -61.2
    ]
  },
  "Samoa": {
    "alpha2": "WS",
    "namePt": "Samoa",
    "flag": "🇼🇸",
    "capital": "Apia",
    "currencyCode": "WST",
    "currencyName": "Tala samoano",
    "symbol": "WST",
    "languages": [
      "samoano",
      "inglês"
    ],
    "timezones": [
      "UTC+13:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -13.58333333,
      -172.33333333
    ]
  },
  "San Marino": {
    "alpha2": "SM",
    "namePt": "San Marino",
    "flag": "🇸🇲",
    "capital": "City of San Marino",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "italiano"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      43.76666666,
      12.41666666
    ]
  },
  "São Tomé & Príncipe": {
    "alpha2": "ST",
    "namePt": "São Tomé e Príncipe",
    "flag": "🇸🇹",
    "capital": "São Tomé",
    "currencyCode": "STD",
    "currencyName": "Dobra de São Tomé e Príncipe (1977–2017)",
    "symbol": "STD",
    "languages": [
      "português"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      1,
      7
    ]
  },
  "Saudi Arabia": {
    "alpha2": "SA",
    "namePt": "Arábia Saudita",
    "flag": "🇸🇦",
    "capital": "Riyadh",
    "currencyCode": "SAR",
    "currencyName": "Riyal saudita",
    "symbol": "SAR",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      25,
      45
    ]
  },
  "Senegal": {
    "alpha2": "SN",
    "namePt": "Senegal",
    "flag": "🇸🇳",
    "capital": "Dakar",
    "currencyCode": "XOF",
    "currencyName": "Franco CFA de BCEAO",
    "symbol": "F CFA",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      14,
      -14
    ]
  },
  "Serbia": {
    "alpha2": "RS",
    "namePt": "Sérvia",
    "flag": "🇷🇸",
    "capital": "Belgrade",
    "currencyCode": "RSD",
    "currencyName": "Dinar sérvio",
    "symbol": "RSD",
    "languages": [
      "RS"
    ],
    "timezones": [
      "UTC+01:00",
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      44.1305021,
      16.4284181
    ]
  },
  "Seychelles": {
    "alpha2": "SC",
    "namePt": "Seicheles",
    "flag": "🇸🇨",
    "capital": "Victoria",
    "currencyCode": "SCR",
    "currencyName": "Rupia seichelense",
    "symbol": "SCR",
    "languages": [
      "francês",
      "inglês"
    ],
    "timezones": [
      "UTC+04:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -4.58333333,
      55.66666666
    ]
  },
  "Sierra Leone": {
    "alpha2": "SL",
    "namePt": "Serra Leoa",
    "flag": "🇸🇱",
    "capital": "Freetown",
    "currencyCode": "SLL",
    "currencyName": "Leone de Serra Leoa (1964—2022)",
    "symbol": "SLL",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      8.5,
      -11.5
    ]
  },
  "Singapore": {
    "alpha2": "SG",
    "namePt": "Singapura",
    "flag": "🇸🇬",
    "capital": "Singapore",
    "currencyCode": "SGD",
    "currencyName": "Dólar singapuriano",
    "symbol": "SGD",
    "languages": [
      "inglês",
      "malaio",
      "tâmil",
      "chinês"
    ],
    "timezones": [
      "UTC+08:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      1.36666666,
      103.8
    ]
  },
  "Slovakia": {
    "alpha2": "SK",
    "namePt": "Eslováquia",
    "flag": "🇸🇰",
    "capital": "Bratislava",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "eslovaco"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      48.66666666,
      19.5
    ]
  },
  "Slovenia": {
    "alpha2": "SI",
    "namePt": "Eslovênia",
    "flag": "🇸🇮",
    "capital": "Ljubljana",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "esloveno"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      46.11666666,
      14.81666666
    ]
  },
  "Solomon Islands": {
    "alpha2": "SB",
    "namePt": "Ilhas Salomão",
    "flag": "🇸🇧",
    "capital": "Honiara",
    "currencyCode": "SBD",
    "currencyName": "Dólar das Ilhas Salomão",
    "symbol": "SBD",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+11:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -8,
      159
    ]
  },
  "Somalia": {
    "alpha2": "SO",
    "namePt": "Somália",
    "flag": "🇸🇴",
    "capital": "Mogadishu",
    "currencyCode": "SOS",
    "currencyName": "Xelim somali",
    "symbol": "SOS",
    "languages": [
      "somali",
      "árabe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      10,
      49
    ]
  },
  "South Africa": {
    "alpha2": "ZA",
    "namePt": "África do Sul",
    "flag": "🇿🇦",
    "capital": "Pretoria",
    "currencyCode": "ZAR",
    "currencyName": "Rand sul-africano",
    "symbol": "ZAR",
    "languages": [
      "africâner",
      "inglês",
      "ndebele do sul",
      "soto do sul",
      "suázi",
      "tswana",
      "tsonga",
      "venda",
      "xhosa",
      "zulu"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -29,
      24
    ]
  },
  "S. Sudan": {
    "alpha2": "SS",
    "namePt": "Sudão do Sul",
    "flag": "🇸🇸",
    "capital": "Juba",
    "currencyCode": "SSP",
    "currencyName": "Libra sul-sudanesa",
    "symbol": "SSP",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      7,
      30
    ]
  },
  "Spain": {
    "alpha2": "ES",
    "namePt": "Espanha",
    "flag": "🇪🇸",
    "capital": "Madrid",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC",
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      40,
      -4
    ]
  },
  "Sri Lanka": {
    "alpha2": "LK",
    "namePt": "Sri Lanka",
    "flag": "🇱🇰",
    "capital": "Colombo",
    "currencyCode": "LKR",
    "currencyName": "Rupia cingalesa",
    "symbol": "LKR",
    "languages": [
      "cingalês",
      "tâmil"
    ],
    "timezones": [
      "UTC+05:30"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      7,
      81
    ]
  },
  "Sudan": {
    "alpha2": "SD",
    "namePt": "Sudão",
    "flag": "🇸🇩",
    "capital": "Khartoum",
    "currencyCode": "SDG",
    "currencyName": "Libra sudanesa",
    "symbol": "SDG",
    "languages": [
      "árabe",
      "inglês"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      15,
      30
    ]
  },
  "Suriname": {
    "alpha2": "SR",
    "namePt": "Suriname",
    "flag": "🇸🇷",
    "capital": "Paramaribo",
    "currencyCode": "SRD",
    "currencyName": "Dólar surinamês",
    "symbol": "SRD",
    "languages": [
      "holandês"
    ],
    "timezones": [
      "UTC−03:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      4,
      -56
    ]
  },
  "Sweden": {
    "alpha2": "SE",
    "namePt": "Suécia",
    "flag": "🇸🇪",
    "capital": "Stockholm",
    "currencyCode": "SEK",
    "currencyName": "Coroa sueca",
    "symbol": "SEK",
    "languages": [
      "sueco"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      62,
      15
    ]
  },
  "Switzerland": {
    "alpha2": "CH",
    "namePt": "Suíça",
    "flag": "🇨🇭",
    "capital": "Bern",
    "currencyCode": "CHE",
    "currencyName": "Euro WIR",
    "symbol": "CHE",
    "languages": [
      "alemão",
      "francês",
      "italiano"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      47,
      8
    ]
  },
  "Syria": {
    "alpha2": "SY",
    "namePt": "Síria",
    "flag": "🇸🇾",
    "capital": "Damascus",
    "currencyCode": "SYP",
    "currencyName": "Libra síria",
    "symbol": "SYP",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      35,
      38
    ]
  },
  "Tajikistan": {
    "alpha2": "TJ",
    "namePt": "Tadjiquistão",
    "flag": "🇹🇯",
    "capital": "Dushanbe",
    "currencyCode": "TJS",
    "currencyName": "Somoni tadjique",
    "symbol": "TJS",
    "languages": [
      "tadjique",
      "russo"
    ],
    "timezones": [
      "UTC+05:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      39,
      71
    ]
  },
  "Tanzania": {
    "alpha2": "TZ",
    "namePt": "Tanzânia",
    "flag": "🇹🇿",
    "capital": "Dodoma",
    "currencyCode": "TZS",
    "currencyName": "Xelim tanzaniano",
    "symbol": "TZS",
    "languages": [
      "suaíli",
      "inglês"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -6,
      35
    ]
  },
  "Thailand": {
    "alpha2": "TH",
    "namePt": "Tailândia",
    "flag": "🇹🇭",
    "capital": "Bangkok",
    "currencyCode": "THB",
    "currencyName": "Baht tailandês",
    "symbol": "฿",
    "languages": [
      "tailandês"
    ],
    "timezones": [
      "UTC+07:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      15,
      100
    ]
  },
  "Timor-Leste": {
    "alpha2": "TL",
    "namePt": "Timor-Leste",
    "flag": "🇹🇱",
    "capital": "Dili",
    "currencyCode": "USD",
    "currencyName": "Dólar americano",
    "symbol": "US$",
    "languages": [
      "português"
    ],
    "timezones": [
      "UTC+09:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      -8.83333333,
      125.91666666
    ]
  },
  "Togo": {
    "alpha2": "TG",
    "namePt": "Togo",
    "flag": "🇹🇬",
    "capital": "Lomé",
    "currencyCode": "XOF",
    "currencyName": "Franco CFA de BCEAO",
    "symbol": "F CFA",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      8,
      1.16666666
    ]
  },
  "Tonga": {
    "alpha2": "TO",
    "namePt": "Tonga",
    "flag": "🇹🇴",
    "capital": "Nuku'alofa",
    "currencyCode": "TOP",
    "currencyName": "Paʻanga tonganesa",
    "symbol": "TOP",
    "languages": [
      "inglês",
      "tonganês"
    ],
    "timezones": [
      "UTC+13:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -20,
      -175
    ]
  },
  "Trinidad & Tobago": {
    "alpha2": "TT",
    "namePt": "Trinidad e Tobago",
    "flag": "🇹🇹",
    "capital": "Port of Spain",
    "currencyCode": "TTD",
    "currencyName": "Dólar de Trinidad e Tobago",
    "symbol": "TTD",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−04:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      11,
      -61
    ]
  },
  "Tunisia": {
    "alpha2": "TN",
    "namePt": "Tunísia",
    "flag": "🇹🇳",
    "capital": "Tunis",
    "currencyCode": "TND",
    "currencyName": "Dinar tunisiano",
    "symbol": "TND",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+01:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      34,
      9
    ]
  },
  "Türkiye": {
    "alpha2": "TR",
    "namePt": "Turquia",
    "flag": "🇹🇷",
    "capital": "Ankara",
    "currencyCode": "TRY",
    "currencyName": "Lira turca",
    "symbol": "TRY",
    "languages": [
      "turco"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      39,
      35
    ]
  },
  "Turkmenistan": {
    "alpha2": "TM",
    "namePt": "Turcomenistão",
    "flag": "🇹🇲",
    "capital": "Ashgabat",
    "currencyCode": "TMT",
    "currencyName": "Manat turcomeno",
    "symbol": "TMT",
    "languages": [
      "turcomeno",
      "russo"
    ],
    "timezones": [
      "UTC+05:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      40,
      60
    ]
  },
  "Tuvalu": {
    "alpha2": "TV",
    "namePt": "Tuvalu",
    "flag": "🇹🇻",
    "capital": "Funafuti",
    "currencyCode": "AUD",
    "currencyName": "Dólar australiano",
    "symbol": "AU$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+12:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -8,
      178
    ]
  },
  "Uganda": {
    "alpha2": "UG",
    "namePt": "Uganda",
    "flag": "🇺🇬",
    "capital": "Kampala",
    "currencyCode": "UGX",
    "currencyName": "Xelim ugandense",
    "symbol": "UGX",
    "languages": [
      "inglês",
      "suaíli"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      1,
      32
    ]
  },
  "Ukraine": {
    "alpha2": "UA",
    "namePt": "Ucrânia",
    "flag": "🇺🇦",
    "capital": "Kiev",
    "currencyCode": "UAH",
    "currencyName": "Hryvnia ucraniano",
    "symbol": "UAH",
    "languages": [
      "ucraniano"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      49,
      32
    ]
  },
  "United Arab Emirates": {
    "alpha2": "AE",
    "namePt": "Emirados Árabes Unidos",
    "flag": "🇦🇪",
    "capital": "Abu Dhabi",
    "currencyCode": "AED",
    "currencyName": "Dirham dos Emirados Árabes Unidos",
    "symbol": "AED",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+04"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      24,
      54
    ]
  },
  "United Kingdom": {
    "alpha2": "GB",
    "namePt": "Reino Unido",
    "flag": "🇬🇧",
    "capital": "London",
    "currencyCode": "GBP",
    "currencyName": "Libra esterlina",
    "symbol": "£",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−08:00",
      "UTC−05:00",
      "UTC−04:00",
      "UTC−03:00",
      "UTC−02:00",
      "UTC",
      "UTC+01:00",
      "UTC+02:00",
      "UTC+06:00"
    ],
    "cont": "EU",
    "region": "Europa",
    "latlng": [
      54,
      -2
    ]
  },
  "United States of America": {
    "alpha2": "US",
    "namePt": "Estados Unidos",
    "flag": "🇺🇸",
    "capital": "Washington D.C.",
    "currencyCode": "USD",
    "currencyName": "Dólar americano",
    "symbol": "US$",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC−12:00",
      "UTC−11:00",
      "UTC−10:00",
      "UTC−09:00",
      "UTC−08:00",
      "UTC−07:00",
      "UTC−06:00",
      "UTC−05:00",
      "UTC−04:00",
      "UTC+10:00",
      "UTC+12:00"
    ],
    "cont": "NA",
    "region": "América do Norte, Central e Caribe",
    "latlng": [
      38,
      -97
    ]
  },
  "Uruguay": {
    "alpha2": "UY",
    "namePt": "Uruguai",
    "flag": "🇺🇾",
    "capital": "Montevideo",
    "currencyCode": "UYI",
    "currencyName": "Peso uruguaio en unidades indexadas",
    "symbol": "UYI",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−03:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      -33,
      -56
    ]
  },
  "Uzbekistan": {
    "alpha2": "UZ",
    "namePt": "Uzbequistão",
    "flag": "🇺🇿",
    "capital": "Tashkent",
    "currencyCode": "UZS",
    "currencyName": "Som uzbeque",
    "symbol": "UZS",
    "languages": [
      "uzbeque",
      "russo"
    ],
    "timezones": [
      "UTC+05:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      41,
      64
    ]
  },
  "Vanuatu": {
    "alpha2": "VU",
    "namePt": "Vanuatu",
    "flag": "🇻🇺",
    "capital": "Port Vila",
    "currencyCode": "VUV",
    "currencyName": "Vatu de Vanuatu",
    "symbol": "VUV",
    "languages": [
      "bislamá",
      "inglês",
      "francês"
    ],
    "timezones": [
      "UTC+11:00"
    ],
    "cont": "OC",
    "region": "Oceania",
    "latlng": [
      -16,
      167
    ]
  },
  "Venezuela": {
    "alpha2": "VE",
    "namePt": "Venezuela",
    "flag": "🇻🇪",
    "capital": "Caracas",
    "currencyCode": "VEF",
    "currencyName": "Bolívar venezuelano (2008–2018)",
    "symbol": "VEF",
    "languages": [
      "espanhol"
    ],
    "timezones": [
      "UTC−04:30"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      8,
      -66
    ]
  },
  "Vietnam": {
    "alpha2": "VN",
    "namePt": "Vietnã",
    "flag": "🇻🇳",
    "capital": "Hanoi",
    "currencyCode": "VND",
    "currencyName": "Dong vietnamita",
    "symbol": "₫",
    "languages": [
      "vietnamita"
    ],
    "timezones": [
      "UTC+07:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      16.16666666,
      107.83333333
    ]
  },
  "Yemen": {
    "alpha2": "YE",
    "namePt": "Iêmen",
    "flag": "🇾🇪",
    "capital": "Sana'a",
    "currencyCode": "YER",
    "currencyName": "Rial iemenita",
    "symbol": "YER",
    "languages": [
      "árabe"
    ],
    "timezones": [
      "UTC+03:00"
    ],
    "cont": "AS",
    "region": "Ásia",
    "latlng": [
      15,
      48
    ]
  },
  "Zambia": {
    "alpha2": "ZM",
    "namePt": "Zâmbia",
    "flag": "🇿🇲",
    "capital": "Lusaka",
    "currencyCode": "ZMK",
    "currencyName": "Cuacha zambiano (1968–2012)",
    "symbol": "ZMK",
    "languages": [
      "inglês"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -15,
      30
    ]
  },
  "Zimbabwe": {
    "alpha2": "ZW",
    "namePt": "Zimbábue",
    "flag": "🇿🇼",
    "capital": "Harare",
    "currencyCode": "USD",
    "currencyName": "Dólar americano",
    "symbol": "US$",
    "languages": [
      "inglês",
      "xona",
      "ndebele do norte"
    ],
    "timezones": [
      "UTC+02:00"
    ],
    "cont": "AF",
    "region": "África",
    "latlng": [
      -20,
      30
    ]
  },
  "Fr. Guiana": {
    "alpha2": "GF",
    "namePt": "Guiana Francesa",
    "flag": "🇬🇫",
    "capital": "Caiena",
    "currencyCode": "EUR",
    "currencyName": "Euro",
    "symbol": "€",
    "languages": [
      "francês"
    ],
    "timezones": [
      "UTC−03:00"
    ],
    "cont": "SA",
    "region": "América do Sul",
    "latlng": [
      4,
      -53
    ]
  }
});

export const CURATED_COUNTRIES = Object.freeze({
  "Brazil": {
    "flag": "🇧🇷",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=70",
        "caption": "Cristo Redentor"
      },
      {
        "url": "https://images.unsplash.com/photo-1554188248-986adbb73be4?w=400&q=70",
        "caption": "Amazônia"
      },
      {
        "url": "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=400&q=70",
        "caption": "Carnaval"
      }
    ],
    "rotations": [
      -2,
      1,
      -1
    ],
    "months": [
      1,
      1,
      1,
      2,
      2,
      2,
      2,
      2,
      1,
      1,
      1,
      1
    ],
    "bestTime": "Abril a setembro é a temporada seca no Sudeste — ideal para Rio e SP. Nordeste brilha de outubro a março com sol garantido. Carnaval (fev/mar) é a festa maior, mas preços triplicam.",
    "currency": "Real Brasileiro (BRL)",
    "symbol": "R$",
    "currencyCode": "BRL",
    "lang": "Português",
    "voltage": "127V/220V · Tipo N",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas.",
    "visa": "free",
    "visaText": "Destino <strong>doméstico</strong> — nenhum requisito de visto para brasileiros. RG válido.",
    "vaccines": "Febre Amarela obrigatória para Amazônia e Centro-Oeste. Hepatite A/B recomendadas.",
    "passport": "RG ou Passaporte válidos.",
    "foods": [
      {
        "e": "🫘",
        "name": "Feijoada",
        "desc": "Feijão preto com carnes de porco, paio e linguiça. Sextas-feiras são sagradas no Brasil.",
        "must": true
      },
      {
        "e": "🦐",
        "name": "Acarajé",
        "desc": "Bolinho frito em dendê com vatapá e camarão. Ícone cultural da Bahia.",
        "must": true
      },
      {
        "e": "🧀",
        "name": "Pão de Queijo",
        "desc": "Bolinho de polvilho e queijo minas — crocante por fora, cremoso por dentro.",
        "must": false
      },
      {
        "e": "🍭",
        "name": "Brigadeiro",
        "desc": "Trufa de chocolate com leite condensado. O doce nacional.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Cumprimentos com beijo na bochecha e abraço são esperados."
      },
      {
        "e": "⚠️",
        "t": "Pontualidade social é flexível — mas não em negócios."
      },
      {
        "e": "❌",
        "t": "Nunca compare com Argentina em tom depreciativo."
      },
      {
        "e": "❌",
        "t": "Evite discutir salários em conversas sociais informais."
      }
    ],
    "vibe": [
      "Caloroso",
      "Festivo",
      "Diverso",
      "Criativo",
      "Imprevisível"
    ],
    "airport": "GRU",
    "airportCity": "São Paulo",
    "flightHours": "Doméstico",
    "flightBRL": "R$ 350–1.400",
    "flightNote": "Voos domésticos frequentes",
    "milesSmiles": "10k–28k",
    "milesAzul": "8k–25k",
    "milesLatam": "10k–30k",
    "milesDifficulty": 1,
    "milesDiffNote": "Emissão fácil. Muita disponibilidade em todas as companhias.",
    "dailyCost": "R$ 200–500",
    "hotelCost": "R$ 120–600",
    "foodCost": "R$ 30–120",
    "tip": "Caldo de cana gelado com pastel de feira num sábado de manhã. R$ 8. Inesquecível.",
    "territories": null,
    "climate": "tropical",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📄",
            "l": "RG ou Passaporte válido"
          },
          {
            "ico": "🏥",
            "l": "Seguro de viagem (aventuras)"
          },
          {
            "ico": "💳",
            "l": "Cartão de crédito e dinheiro"
          }
        ]
      },
      {
        "group": "Roupas (Tropical)",
        "items": [
          {
            "ico": "👕",
            "l": "Camisetas leves"
          },
          {
            "ico": "🧴",
            "l": "Protetor solar FPS 50+"
          },
          {
            "ico": "🕶️",
            "l": "Óculos de sol"
          },
          {
            "ico": "🧥",
            "l": "Casaco leve para ar-condicionado"
          }
        ]
      },
      {
        "group": "Saúde",
        "items": [
          {
            "ico": "💊",
            "l": "Repelente com DEET (mosquitos)"
          },
          {
            "ico": "💉",
            "l": "Vacina febre amarela (Amazônia)"
          },
          {
            "ico": "🩺",
            "l": "Kit de primeiros socorros"
          }
        ]
      }
    ]
  },
  "Argentina": {
    "flag": "🇦🇷",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=400&q=70",
        "caption": "Buenos Aires"
      },
      {
        "url": "https://images.unsplash.com/photo-1531590878845-12627191e687?w=400&q=70",
        "caption": "Patagônia"
      },
      {
        "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70",
        "caption": "Mendoza"
      }
    ],
    "rotations": [
      1,
      -2,
      0
    ],
    "months": [
      2,
      2,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      2,
      2
    ],
    "bestTime": "Outubro a março (verão austral) para Buenos Aires e Patagônia. Junho a agosto para Bariloche e ski. Évite inverno no sul (jun–ago): frio intenso.",
    "currency": "Peso Argentino (ARS)",
    "symbol": "$",
    "currencyCode": "ARS",
    "lang": "Espanhol Rioplatense",
    "voltage": "220V · Tipo I/C",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. RG válido para brasileiros.",
    "visa": "free",
    "visaText": "<strong>Livre para brasileiros</strong> — RG ou Passaporte válidos. Mercosul sem visto.",
    "vaccines": "Sem exigência específica. Hepatite A recomendada.",
    "passport": "RG ou Passaporte válidos. Sem prazo mínimo.",
    "foods": [
      {
        "e": "🥩",
        "name": "Asado",
        "desc": "Churrasco argentino ao carvão com costela, chorizo e morcilla. Religião nacional.",
        "must": true
      },
      {
        "e": "🥟",
        "name": "Empanadas",
        "desc": "Massa recheada com carne, azeitona e ovo. Variam por região.",
        "must": true
      },
      {
        "e": "🍯",
        "name": "Dulce de Leche",
        "desc": "Caramelo cremoso de leite presente em absolutamente tudo.",
        "must": false
      },
      {
        "e": "☕",
        "name": "Submarino",
        "desc": "Chocolate quente com barra de chocolate mergulhada. Clássico das confiterias.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Abraços calorosos e beijo na bochecha são cumprimentos normais."
      },
      {
        "e": "⚠️",
        "t": "Jantares após as 21h — em restaurantes às 22h é horário de pico."
      },
      {
        "e": "❌",
        "t": "Nunca chame a flauta de pão de 'baguete' — é ofensivo para portenhos."
      },
      {
        "e": "❌",
        "t": "Não subestime a importância do mate — recusar pode soar como rejeição."
      }
    ],
    "vibe": [
      "Passional",
      "Sofisticado",
      "Orgulhoso",
      "Cultural",
      "Tardão"
    ],
    "airport": "EZE",
    "airportCity": "Buenos Aires",
    "flightHours": "~3h",
    "flightBRL": "R$ 800–2.500",
    "flightNote": "Voos diretos frequentes",
    "milesSmiles": "8k–20k",
    "milesAzul": "8k–22k",
    "milesLatam": "8k–20k",
    "milesDifficulty": 1,
    "milesDiffNote": "Destino próximo com excelente disponibilidade. Emissão simples.",
    "dailyCost": "R$ 250–600",
    "hotelCost": "R$ 150–600",
    "foodCost": "R$ 40–150",
    "tip": "Bife de chorizo com Malbec num parrilla tradicional de Palermo, Buenos Aires. Ponto: ao ponto.",
    "territories": null,
    "climate": "varied",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📄",
            "l": "RG ou Passaporte válido"
          },
          {
            "ico": "💳",
            "l": "Dinheiro em espécie (câmbio blue)"
          },
          {
            "ico": "🏥",
            "l": "Seguro de viagem"
          }
        ]
      },
      {
        "group": "Roupas",
        "items": [
          {
            "ico": "🧥",
            "l": "Casaco para Buenos Aires (ventos)"
          },
          {
            "ico": "❄️",
            "l": "Roupa térmica para Patagônia"
          },
          {
            "ico": "👟",
            "l": "Calçado confortável"
          }
        ]
      },
      {
        "group": "Dicas",
        "items": [
          {
            "ico": "💵",
            "l": "Use dólares para câmbio mais vantajoso"
          },
          {
            "ico": "📱",
            "l": "WhatsApp funciona normalmente"
          }
        ]
      }
    ]
  },
  "Chile": {
    "flag": "🇨🇱",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1531590878845-12627191e687?w=400&q=70",
        "caption": "Torres del Paine"
      },
      {
        "url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=70",
        "caption": "Atacama"
      },
      {
        "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70",
        "caption": "Santiago"
      }
    ],
    "rotations": [
      0,
      -2,
      1
    ],
    "months": [
      2,
      2,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      2,
      2
    ],
    "bestTime": "Outubro a março para Patagônia e Torres del Paine. Atacama é visitável o ano todo. Junho–agosto para ski em Portillo e Valle Nevado.",
    "currency": "Peso Chileno (CLP)",
    "symbol": "CL$",
    "currencyCode": "CLP",
    "lang": "Espanhol",
    "voltage": "220V · Tipo L",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. RG válido para brasileiros.",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros. RG ou Passaporte válidos.",
    "vaccines": "Sem exigência. Hepatite A recomendada.",
    "passport": "RG ou Passaporte válidos.",
    "foods": [
      {
        "e": "🥟",
        "name": "Empanada de Pino",
        "desc": "Massa assada com carne moída, ovo, azeitona e cebola. O prato mais chileno.",
        "must": true
      },
      {
        "e": "🦀",
        "name": "Cazuela de Mariscos",
        "desc": "Caldo aromático de frutos do mar com batata. Sabor puro do Pacífico.",
        "must": true
      },
      {
        "e": "🍷",
        "name": "Pisco Sour",
        "desc": "Coquetel de pisco com limão, açúcar e clara de ovo. Disputa com o Peru.",
        "must": false
      },
      {
        "e": "🫙",
        "name": "Pebre",
        "desc": "Molho de tomate, coentro, alho e pimenta — acompanha absolutamente tudo.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Chilenos são formais — use 'usted' até que peçam 'tuteo'."
      },
      {
        "e": "✅",
        "t": "Pontualidade é valorizada mais que nos países vizinhos."
      },
      {
        "e": "⚠️",
        "t": "Não chame santiaguinos de 'porteños' — isso é gíria argentina."
      },
      {
        "e": "❌",
        "t": "Nunca confunda o Pisco Sour com o peruano — questão de orgulho nacional."
      }
    ],
    "vibe": [
      "Organizado",
      "Tranquilo",
      "Natural",
      "Distante",
      "Refinado"
    ],
    "airport": "SCL",
    "airportCity": "Santiago",
    "flightHours": "~4h",
    "flightBRL": "R$ 900–3.000",
    "flightNote": "Voos diretos frequentes",
    "milesSmiles": "12k–30k",
    "milesAzul": "14k–32k",
    "milesLatam": "10k–28k",
    "milesDifficulty": 1,
    "milesDiffNote": "Destino próximo com boa disponibilidade.",
    "dailyCost": "R$ 400–950",
    "hotelCost": "R$ 220–800",
    "foodCost": "R$ 60–200",
    "tip": "Pisco Sour num mirante em Valparaíso ao entardecer, com vista para o Pacífico. Inesquecível.",
    "territories": null,
    "climate": "varied",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📄",
            "l": "RG ou Passaporte válido"
          },
          {
            "ico": "🏥",
            "l": "Seguro de viagem"
          },
          {
            "ico": "💳",
            "l": "Cartão internacional"
          }
        ]
      },
      {
        "group": "Roupas (Variado)",
        "items": [
          {
            "ico": "🧥",
            "l": "Casaco impermeável (Patagônia)"
          },
          {
            "ico": "❄️",
            "l": "Roupa térmica para Torres del Paine"
          },
          {
            "ico": "🥾",
            "l": "Bota de trekking"
          },
          {
            "ico": "🕶️",
            "l": "Óculos UV (Atacama tem UV extremo)"
          }
        ]
      },
      {
        "group": "Altitude/Aventura",
        "items": [
          {
            "ico": "💧",
            "l": "Garrafa de água reutilizável"
          },
          {
            "ico": "🧴",
            "l": "Protetor solar FPS 70+ (Atacama)"
          }
        ]
      }
    ]
  },
  "Peru": {
    "flag": "🇵🇪",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&q=70",
        "caption": "Machu Picchu"
      },
      {
        "url": "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&q=70",
        "caption": "Lima"
      },
      {
        "url": "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=70",
        "caption": "Lago Titicaca"
      }
    ],
    "rotations": [
      -1,
      2,
      -2
    ],
    "months": [
      2,
      2,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      2,
      2
    ],
    "bestTime": "Maio a setembro é a estação seca — perfeita para Machu Picchu e trilhas. Dezembro a março: chuvas intensas na região andina. Abril e outubro são meses ideais de transição.",
    "currency": "Sol Peruano (PEN)",
    "symbol": "S/",
    "currencyCode": "PEN",
    "lang": "Espanhol / Quéchua",
    "voltage": "220V · Tipo A/C",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. RG válido para brasileiros.",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros. RG ou Passaporte válidos.",
    "vaccines": "Febre Amarela obrigatória para Amazônia peruana. Hepatite A/B e Febre Tifoide recomendadas.",
    "passport": "RG ou Passaporte válidos.",
    "foods": [
      {
        "e": "🐟",
        "name": "Ceviche Clásico",
        "desc": "Peixe fresco marinado em leche de tigre (limão, coentro, ají). Lima é a capital gastronômica da América.",
        "must": true
      },
      {
        "e": "🥩",
        "name": "Lomo Saltado",
        "desc": "Bifes refogados com tomate, cebola, pimenta e batata frita. Fusão chifa (chinesa-peruana).",
        "must": true
      },
      {
        "e": "🌶️",
        "name": "Aji de Gallina",
        "desc": "Frango desfiado em creme de ají amarelo e nozes. Prato nacional de conforto.",
        "must": false
      },
      {
        "e": "🍢",
        "name": "Anticuchos",
        "desc": "Espetinho de coração de boi marinado na brasa. Street food sagrado de Lima.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Espanhol básico é muito bem recebido — peruanos adoram turistas que tentam."
      },
      {
        "e": "⚠️",
        "t": "Altitude em Cusco (~3.400m): descanse os 2 primeiros dias, beba chá de coca."
      },
      {
        "e": "⚠️",
        "t": "Machu Picchu exige entrada antecipada — ingressos esgotam com meses de antecedência."
      },
      {
        "e": "❌",
        "t": "Não fotografe cerimônias sagradas indígenas sem permissão explícita."
      }
    ],
    "vibe": [
      "Ancestral",
      "Gastronômico",
      "Colorido",
      "Hospitaleiro",
      "Profundo"
    ],
    "airport": "LIM",
    "airportCity": "Lima",
    "flightHours": "~5–6h",
    "flightBRL": "R$ 1.200–4.500",
    "flightNote": "Voos diretos de GRU e GIG",
    "milesSmiles": "18k–36k",
    "milesAzul": "20k–38k",
    "milesLatam": "18k–34k",
    "milesDifficulty": 1,
    "milesDiffNote": "Boa disponibilidade. Latam tem voos diretos frequentes.",
    "dailyCost": "R$ 260–650",
    "hotelCost": "R$ 130–600",
    "foodCost": "R$ 40–160",
    "tip": "Ceviche às 12h num mercado municipal de Lima. Lima é a capital gastronômica das Américas — a diferença é real.",
    "territories": null,
    "climate": "varied",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📄",
            "l": "RG ou Passaporte válido"
          },
          {
            "ico": "🎫",
            "l": "Ingresso Machu Picchu reservado online"
          },
          {
            "ico": "🏥",
            "l": "Seguro de viagem com cobertura altitude"
          }
        ]
      },
      {
        "group": "Altitude — CRÍTICO",
        "items": [
          {
            "ico": "☕",
            "l": "Chá de coca para mal da altitude"
          },
          {
            "ico": "💊",
            "l": "Acetazolamida (Diamox) — consulte médico"
          },
          {
            "ico": "🚶",
            "l": "Chegue 1 dia antes e DESCANSE em Cusco"
          },
          {
            "ico": "💧",
            "l": "Beba muita água — altitude desidrata"
          }
        ]
      },
      {
        "group": "Roupas",
        "items": [
          {
            "ico": "🧥",
            "l": "Casaco para noites frias em Cusco (5°C)"
          },
          {
            "ico": "🧴",
            "l": "Protetor solar FPS 70+ (altitude+UV)"
          },
          {
            "ico": "🥾",
            "l": "Bota para trilha Inca ou caminhadas"
          }
        ]
      }
    ]
  },
  "Colombia": {
    "flag": "🇨🇴",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1558618047-3c5dc9c7c5f1?w=400&q=70",
        "caption": "Cartagena"
      },
      {
        "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70",
        "caption": "Medellín - El Poblado"
      },
      {
        "url": "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&q=70",
        "caption": "Eje Cafetero"
      }
    ],
    "rotations": [
      2,
      -1,
      1
    ],
    "months": [
      2,
      2,
      1,
      1,
      1,
      2,
      2,
      1,
      1,
      1,
      1,
      2
    ],
    "bestTime": "Dezembro a março e julho a agosto são as estações secas. A Colômbia tem clima tropical constante — temperatura muda pela altitude, não pela estação.",
    "currency": "Peso Colombiano (COP)",
    "symbol": "$",
    "currencyCode": "COP",
    "lang": "Espanhol",
    "voltage": "110V · Tipo A/B",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. Passaporte obrigatório para brasileiros.",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros por até 90 dias. Passaporte obrigatório (RG não é aceito).",
    "vaccines": "Febre Amarela obrigatória para Amazônia e Orinoquía. Hepatite A/B e Febre Tifoide recomendadas.",
    "passport": "Passaporte obrigatório. RG não é aceito na Colômbia.",
    "foods": [
      {
        "e": "🥘",
        "name": "Bandeja Paisa",
        "desc": "Prato típico: feijão vermelho, arroz, carne moída, chicharrón, ovo, chorizo e patacón.",
        "must": true
      },
      {
        "e": "🥣",
        "name": "Ajiaco Bogotano",
        "desc": "Sopa cremosa de três tipos de batata com frango e guasca. Prato da capital.",
        "must": true
      },
      {
        "e": "🫓",
        "name": "Arepa de Choclo",
        "desc": "Tortilla de milho doce com queijo derretido. Café da manhã colombiano perfeito.",
        "must": false
      },
      {
        "e": "☕",
        "name": "Café Colombiano",
        "desc": "No Eje Cafetero, visite uma finca e beba café recém-colhido. Transformador.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Colombianos são expressivos e próximos fisicamente — não interprete como invasão."
      },
      {
        "e": "✅",
        "t": "Café é identidade nacional — aceite sempre uma xícara."
      },
      {
        "e": "⚠️",
        "t": "Bogotá tem 2.600m de altitude — primeiros dias podem causar cansaço."
      },
      {
        "e": "❌",
        "t": "Nunca faça piadas sobre a violência passada — o país mudou e os colombianos são sensíveis ao tema."
      }
    ],
    "vibe": [
      "Alegre",
      "Expressivo",
      "Musical",
      "Colorido",
      "Resiliente"
    ],
    "airport": "BOG",
    "airportCity": "Bogotá",
    "flightHours": "~5h",
    "flightBRL": "R$ 1.200–4.000",
    "flightNote": "Voos diretos de GRU",
    "milesSmiles": "20k–40k",
    "milesAzul": "22k–42k",
    "milesLatam": "20k–38k",
    "milesDifficulty": 1,
    "milesDiffNote": "Boa disponibilidade. Latam e Avianca com voos frequentes.",
    "dailyCost": "R$ 280–700",
    "hotelCost": "R$ 150–600",
    "foodCost": "R$ 40–160",
    "tip": "Café coado numa finca cafetera do Eje Cafetero. É como café deveria ser em todo lugar do mundo.",
    "territories": null,
    "climate": "tropical",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "PASSAPORTE obrigatório (RG não aceito)"
          },
          {
            "ico": "🏥",
            "l": "Seguro de viagem"
          },
          {
            "ico": "💳",
            "l": "Cartão internacional"
          }
        ]
      },
      {
        "group": "Saúde",
        "items": [
          {
            "ico": "💉",
            "l": "Vacina Febre Amarela (exigida)"
          },
          {
            "ico": "💊",
            "l": "Repelente DEET (dengue e zika)"
          },
          {
            "ico": "💧",
            "l": "Água mineral (Bogotá e cidades grandes, ok)"
          }
        ]
      },
      {
        "group": "Roupas",
        "items": [
          {
            "ico": "🧥",
            "l": "Casaco para Bogotá e Medellín (noites frias)"
          },
          {
            "ico": "👕",
            "l": "Roupas leves para Cartagena e costa"
          },
          {
            "ico": "☂️",
            "l": "Guarda-chuva dobrável"
          }
        ]
      }
    ]
  },
  "Uruguay": {
    "flag": "🇺🇾",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=400&q=70",
        "caption": "Montevidéu"
      },
      {
        "url": "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=400&q=70",
        "caption": "Punta del Este"
      },
      {
        "url": "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=400&q=70",
        "caption": "Colônia del Sacramento"
      }
    ],
    "rotations": [
      -1,
      2,
      0
    ],
    "months": [
      2,
      2,
      1,
      1,
      0,
      0,
      0,
      0,
      1,
      1,
      2,
      2
    ],
    "bestTime": "Dezembro a março é o verão austral — ideal para Punta del Este e praias. Inverno (jun–ago) é frio e cinzento. Colônia e Montevidéu são agradáveis a maior parte do ano.",
    "currency": "Peso Uruguaio (UYU)",
    "symbol": "$U",
    "currencyCode": "UYU",
    "lang": "Espanhol",
    "voltage": "220V · Tipo F",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. RG válido para brasileiros.",
    "visa": "free",
    "visaText": "<strong>Livre para brasileiros</strong> — RG ou Passaporte válidos. Mercosul.",
    "vaccines": "Sem exigência específica. Hepatite A recomendada.",
    "passport": "RG ou Passaporte válidos.",
    "foods": [
      {
        "e": "🥩",
        "name": "Chivito",
        "desc": "Sanduíche com bife, presunto, ovo, queijo e maionese. O prato nacional do Uruguai.",
        "must": true
      },
      {
        "e": "🍖",
        "name": "Asado Uruguayo",
        "desc": "Churrasco com técnica diferente da argentina — more low and slow.",
        "must": true
      },
      {
        "e": "🥙",
        "name": "Medialunas",
        "desc": "Croissant uruguaio mais doce, perfeito com café ao amanhecer.",
        "must": false
      },
      {
        "e": "🍪",
        "name": "Alfajor Uruguaio",
        "desc": "Biscoito recheado de dulce de leche, mais leve que o argentino.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Uruguaios são reservados mas extremamente gentis com quem se aproxima bem."
      },
      {
        "e": "✅",
        "t": "Mate é bebido em todos os lugares — em parques, praias e reuniões de trabalho."
      },
      {
        "e": "⚠️",
        "t": "País muito secular — religião raramente é tópico de conversa social."
      },
      {
        "e": "❌",
        "t": "Não confunda a cultura uruguaia com a argentina — existe orgulho nacional forte."
      }
    ],
    "vibe": [
      "Tranquilo",
      "Liberal",
      "Culto",
      "Seguro",
      "Discreto"
    ],
    "airport": "MVD",
    "airportCity": "Montevidéu",
    "flightHours": "~2h30",
    "flightBRL": "R$ 700–2.200",
    "flightNote": "Voos de GRU e POA",
    "milesSmiles": "6k–16k",
    "milesAzul": "6k–18k",
    "milesLatam": "6k–16k",
    "milesDifficulty": 1,
    "milesDiffNote": "Destino próximo e fácil emissão.",
    "dailyCost": "R$ 350–800",
    "hotelCost": "R$ 200–700",
    "foodCost": "R$ 60–200",
    "tip": "Chivito com fritas numa lanchonete simples de Montevidéu às 14h. O melhor sanduíche da América do Sul.",
    "territories": null,
    "climate": "temperate",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📄",
            "l": "RG ou Passaporte válido"
          },
          {
            "ico": "💳",
            "l": "Cartão internacional"
          },
          {
            "ico": "🏥",
            "l": "Seguro de viagem"
          }
        ]
      },
      {
        "group": "Roupas",
        "items": [
          {
            "ico": "🧥",
            "l": "Casaco para noites e inverno"
          },
          {
            "ico": "🌂",
            "l": "Guarda-chuva (chuvas frequentes)"
          },
          {
            "ico": "🩱",
            "l": "Roupa de banho (verão)"
          }
        ]
      }
    ]
  },
  "Paraguay": {
    "flag": "🇵🇾",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
        "caption": "Assunção"
      },
      {
        "url": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=70",
        "caption": "Missões Jesuítas"
      },
      {
        "url": "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&q=70",
        "caption": "Pantanal paraguaio"
      }
    ],
    "rotations": [
      1,
      -1,
      2
    ],
    "months": [
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      2,
      2,
      1,
      1,
      1
    ],
    "bestTime": "Maio a setembro é a estação mais amena — calor intenso no verão (dez–fev), podendo ultrapassar 40°C no Chaco. Inverno é seco e agradável.",
    "currency": "Guarani (PYG)",
    "symbol": "₲",
    "currencyCode": "PYG",
    "lang": "Espanhol / Guarani",
    "voltage": "220V · Tipo A/B",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. RG válido para brasileiros.",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros. RG ou Passaporte válidos.",
    "vaccines": "Febre Amarela obrigatória para todo o território. Hepatite A/B recomendadas.",
    "passport": "RG ou Passaporte válidos.",
    "foods": [
      {
        "e": "🥘",
        "name": "Sopa Paraguaya",
        "desc": "Não é sopa — é bolo de milho e queijo cozido. Prato nacional histórico.",
        "must": true
      },
      {
        "e": "🥩",
        "name": "Chipá",
        "desc": "Pão de queijo paraguaio feito com polvilho. Disponível em todos os lugares.",
        "must": true
      },
      {
        "e": "🫖",
        "name": "Tereré",
        "desc": "Mate gelado com ervas medicinais — o símbolo cultural mais forte do país.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Guarani é co-oficial — dizer 'mba'éichapa' (como vai?) conquista qualquer paraguaio."
      },
      {
        "e": "⚠️",
        "t": "Febre Amarela é obrigatória — exigida na fronteira e no aeroporto."
      },
      {
        "e": "❌",
        "t": "Não subestime o calor do Chaco no verão — é perigoso para quem não está aclimatado."
      }
    ],
    "vibe": [
      "Tranquilo",
      "Caloroso",
      "Bilíngue",
      "Discreto",
      "Fronteiriço"
    ],
    "airport": "ASU",
    "airportCity": "Assunção",
    "flightHours": "~2h30",
    "flightBRL": "R$ 700–2.000",
    "flightNote": "Voos de GRU via conexão",
    "milesSmiles": "6k–16k",
    "milesAzul": "6k–18k",
    "milesLatam": "6k–16k",
    "milesDifficulty": 1,
    "milesDiffNote": "Poucos voos diretos. Conexão via BUE ou CGH.",
    "dailyCost": "R$ 180–450",
    "hotelCost": "R$ 100–400",
    "foodCost": "R$ 25–100",
    "tip": "Tereré com ervas medicinais numa praça de Assunção com os locais. É o ritual social mais paraguaio que existe.",
    "territories": null,
    "climate": "tropical",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📄",
            "l": "RG ou Passaporte válido"
          },
          {
            "ico": "💉",
            "l": "Cartão de vacina Febre Amarela (OBRIGATÓRIO)"
          },
          {
            "ico": "🏥",
            "l": "Seguro de viagem"
          }
        ]
      },
      {
        "group": "Saúde",
        "items": [
          {
            "ico": "💊",
            "l": "Repelente DEET (dengue e malária no Chaco)"
          },
          {
            "ico": "💧",
            "l": "Muita água — calor extremo"
          },
          {
            "ico": "☀️",
            "l": "Protetor solar alto"
          }
        ]
      }
    ]
  },
  "Bolivia": {
    "flag": "🇧🇴",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1583244532610-2c49e76c87ca?w=400&q=70",
        "caption": "Salar de Uyuni"
      },
      {
        "url": "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&q=70",
        "caption": "La Paz"
      },
      {
        "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
        "caption": "Lago Titicaca"
      }
    ],
    "rotations": [
      -2,
      1,
      -1
    ],
    "months": [
      2,
      2,
      2,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      2,
      2
    ],
    "bestTime": "Maio a outubro é a estação seca — perfeita para o Salar de Uyuni. Novembro a abril: chuvas intensas inundam partes do Salar. La Paz é visitável o ano todo.",
    "currency": "Boliviano (BOB)",
    "symbol": "Bs.",
    "currencyCode": "BOB",
    "lang": "Espanhol / Quéchua / Aimará",
    "voltage": "220V · Tipo A/C",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. Passaporte obrigatório para brasileiros.",
    "visa": "cond",
    "visaText": "Visto obrigatório para brasileiros em alguns postos. <strong>Passaporte obrigatório</strong>. Verifique com a Embaixada antes de viajar.",
    "vaccines": "Febre Amarela obrigatória para regiões tropicais. Hepatite A/B e Febre Tifoide recomendadas.",
    "passport": "Passaporte obrigatório. RG não é aceito.",
    "foods": [
      {
        "e": "🥣",
        "name": "Salteñas",
        "desc": "Empanada caldo boliviana recheada com carne, batata e azeitona. Café da manhã nacional.",
        "must": true
      },
      {
        "e": "🍲",
        "name": "Sopa de Maní",
        "desc": "Sopa cremosa de amendoim com batata e carne. Prato andino ancestral.",
        "must": true
      },
      {
        "e": "🥤",
        "name": "Singani",
        "desc": "Destilado de uva boliviano — a bebida nacional. Difere do pisco.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "⚠️",
        "t": "Altitude em La Paz (~3.600m) e Potosí (~4.000m): aclimatação é fundamental."
      },
      {
        "e": "✅",
        "t": "Chá de coca é oferecido em todos os hotéis — alivia o mal da altitude."
      },
      {
        "e": "❌",
        "t": "Não fotografe mulheres cholitas sem permissão — é considerado falta de respeito."
      }
    ],
    "vibe": [
      "Ancestral",
      "Colorido",
      "Difícil",
      "Autêntico",
      "Altitude"
    ],
    "airport": "VVI",
    "airportCity": "Santa Cruz (BOL)",
    "flightHours": "~4h",
    "flightBRL": "R$ 1.200–4.000",
    "flightNote": "Via Santa Cruz ou La Paz",
    "milesSmiles": "16k–34k",
    "milesAzul": "18k–36k",
    "milesLatam": "16k–32k",
    "milesDifficulty": 2,
    "milesDiffNote": "Disponibilidade moderada. Poucos parceiros diretos.",
    "dailyCost": "R$ 200–500",
    "hotelCost": "R$ 100–450",
    "foodCost": "R$ 30–120",
    "tip": "Assistir o pôr do sol no Salar de Uyuni num carro 4x4 com reflexo do céu na lâmina d'água. A fotografia mais surrealista do mundo.",
    "territories": null,
    "climate": "varied",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "PASSAPORTE obrigatório"
          },
          {
            "ico": "💉",
            "l": "Vacina Febre Amarela (obrigatória)"
          },
          {
            "ico": "🏥",
            "l": "Seguro com cobertura altitude"
          }
        ]
      },
      {
        "group": "Altitude — CRÍTICO",
        "items": [
          {
            "ico": "☕",
            "l": "Chá de coca desde o primeiro dia"
          },
          {
            "ico": "💊",
            "l": "Diamox (acetazolamida) — consulte médico"
          },
          {
            "ico": "💧",
            "l": "Hidratação constante"
          },
          {
            "ico": "🚶",
            "l": "Movimentos lentos nos primeiros 2 dias"
          }
        ]
      },
      {
        "group": "Roupas",
        "items": [
          {
            "ico": "❄️",
            "l": "Roupa térmica para La Paz e Uyuni (noites -10°C)"
          },
          {
            "ico": "🧥",
            "l": "Casaco impermeável"
          },
          {
            "ico": "🕶️",
            "l": "Óculos UV (altitude extrema)"
          }
        ]
      }
    ]
  },
  "Ecuador": {
    "flag": "🇪🇨",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=70",
        "caption": "Galápagos"
      },
      {
        "url": "https://images.unsplash.com/photo-1547222526-3e2ab0c3e1e1?w=400&q=70",
        "caption": "Quito"
      },
      {
        "url": "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=400&q=70",
        "caption": "Cotapaxi"
      }
    ],
    "rotations": [
      1,
      -2,
      2
    ],
    "months": [
      1,
      1,
      2,
      2,
      1,
      1,
      2,
      2,
      1,
      1,
      1,
      1
    ],
    "bestTime": "Junho a setembro: temporada seca para Quito e Andes. Dezembro a maio: melhor para Galápagos (temperatura do mar ideal). Amazônia é visitável o ano todo.",
    "currency": "Dólar Americano (USD)",
    "symbol": "US$",
    "currencyCode": "USD",
    "lang": "Espanhol / Quíchua",
    "voltage": "120V · Tipo A/B",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. Passaporte obrigatório.",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros por até 90 dias. Passaporte obrigatório.",
    "vaccines": "Febre Amarela obrigatória para regiões amazônicas. Hepatite A/B e Febre Tifoide recomendadas.",
    "passport": "Passaporte obrigatório. RG não é aceito.",
    "foods": [
      {
        "e": "🥘",
        "name": "Seco de Pollo",
        "desc": "Ensopado de frango com coentro e cerveja, servido com arroz e patacón. O conforto equatoriano.",
        "must": true
      },
      {
        "e": "🍹",
        "name": "Ceviche de Camarão",
        "desc": "Versão equatoriana com limão, tomate e coentro — servido em tigela com patacones.",
        "must": true
      },
      {
        "e": "🫓",
        "name": "Patacones",
        "desc": "Fatias de banana verde frita e prensada. Acompanha tudo na costa.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Quito fica a 2.800m — ajuste a velocidade nos primeiros 24h."
      },
      {
        "e": "⚠️",
        "t": "Galápagos tem regras rígidas de preservação — siga as instruções dos guias à risca."
      },
      {
        "e": "❌",
        "t": "Não tente entrar nas Galápagos com comida de fora — fiscalização rigorosa."
      }
    ],
    "vibe": [
      "Natural",
      "Biodiverso",
      "Tranquilo",
      "Ancestral",
      "Verde"
    ],
    "airport": "UIO",
    "airportCity": "Quito",
    "flightHours": "~5h",
    "flightBRL": "R$ 1.300–4.500",
    "flightNote": "Voos de GRU via conexão",
    "milesSmiles": "20k–40k",
    "milesAzul": "22k–42k",
    "milesLatam": "20k–38k",
    "milesDifficulty": 1,
    "milesDiffNote": "Boa disponibilidade via Lima ou Bogotá.",
    "dailyCost": "R$ 250–650",
    "hotelCost": "R$ 130–600",
    "foodCost": "R$ 35–150",
    "tip": "Mergulho nas Galápagos com leões-marinhos. É a experiência de natureza mais extraordinária do planeta.",
    "territories": null,
    "climate": "varied",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte obrigatório"
          },
          {
            "ico": "💉",
            "l": "Vacina Febre Amarela"
          },
          {
            "ico": "🎫",
            "l": "Ingresso Galápagos (taxa de entrada)"
          }
        ]
      },
      {
        "group": "Galápagos",
        "items": [
          {
            "ico": "🚫",
            "l": "NENHUM alimento externo permitido"
          },
          {
            "ico": "📸",
            "l": "Câmera e cartões extras"
          },
          {
            "ico": "🤿",
            "l": "Equipamento de snorkel (aluga lá também)"
          }
        ]
      },
      {
        "group": "Altitude",
        "items": [
          {
            "ico": "☕",
            "l": "Chá de coca para Quito (2.800m)"
          },
          {
            "ico": "💧",
            "l": "Hidratação constante"
          }
        ]
      }
    ]
  },
  "Venezuela": {
    "flag": "🇻🇪",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=400&q=70",
        "caption": "Angel Falls"
      },
      {
        "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
        "caption": "Caracas"
      },
      {
        "url": "https://images.unsplash.com/photo-1558618047-3c5dc9c7c5f1?w=400&q=70",
        "caption": "Gran Sabana"
      }
    ],
    "rotations": [
      -1,
      0,
      2
    ],
    "months": [
      2,
      2,
      1,
      1,
      1,
      0,
      1,
      1,
      1,
      1,
      2,
      2
    ],
    "bestTime": "Dezembro a abril é a estação seca — ideal para o Angel Falls (maior cachoeira do mundo em volume). Junho a agosto: período chuvoso, mas Angel Falls está mais caudaloso.",
    "currency": "Bolívar Digital (VED)",
    "symbol": "Bs.D",
    "currencyCode": "VED",
    "lang": "Espanhol",
    "voltage": "120V · Tipo A/B",
    "conflict": "yellow",
    "conflictText": "<strong>Atenção elevada.</strong> O Itamaraty recomenda cautela e acompanhamento constante da situação política e econômica. Instabilidade política, infraestrutura limitada e escassez de serviços básicos em várias regiões. Consulte o Itamaraty antes de planejar.",
    "borderStatus": "warn",
    "borderNote": "Fronteiras abertas com restrições. Monitoramento necessário.",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros. Passaporte obrigatório.",
    "vaccines": "Febre Amarela obrigatória. Malária recomendada para regiões interiores.",
    "passport": "Passaporte obrigatório com validade de 6 meses.",
    "foods": [
      {
        "e": "🫓",
        "name": "Arepa",
        "desc": "Pão de milho recheado com tudo — carne, frango, queijo. Base da alimentação venezuelana.",
        "must": true
      },
      {
        "e": "🥣",
        "name": "Pabellón Criollo",
        "desc": "Arroz, feijão preto, carne desfiada e tostones. O prato nacional completo.",
        "must": true
      }
    ],
    "etiquette": [
      {
        "e": "⚠️",
        "t": "Situação econômica volátil — use dólares ou euros em espécie."
      },
      {
        "e": "⚠️",
        "t": "Evite exibir eletrônicos caros ou jóias em público."
      },
      {
        "e": "❌",
        "t": "Não viaje sem seguro de saúde com cobertura de evacuação médica."
      }
    ],
    "vibe": [
      "Natureza Selvagem",
      "Complexo",
      "Musical",
      "Contrastante"
    ],
    "airport": "CCS",
    "airportCity": "Caracas",
    "flightHours": "~5h",
    "flightBRL": "R$ 1.500–5.000",
    "flightNote": "Voos com conexão, disponibilidade limitada",
    "milesSmiles": "20k–40k",
    "milesAzul": "—",
    "milesLatam": "20k–38k",
    "milesDifficulty": 3,
    "milesDiffNote": "Poucos voos regulares. Emissão complexa.",
    "dailyCost": "R$ 200–600",
    "hotelCost": "R$ 150–600",
    "foodCost": "R$ 30–150",
    "tip": "Angel Falls visto de cima num sobrevoo de avião leve ao amanhecer. A maior cachoeira do mundo.",
    "territories": null,
    "climate": "tropical",
    "checklist": [
      {
        "group": "Documentos — URGENTE",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte com 6 meses de validade"
          },
          {
            "ico": "💵",
            "l": "Dólares em espécie (sistema bancário limitado)"
          },
          {
            "ico": "🏥",
            "l": "Seguro com evacuação médica"
          }
        ]
      },
      {
        "group": "Segurança",
        "items": [
          {
            "ico": "⚠️",
            "l": "Consulte Itamaraty antes da viagem"
          },
          {
            "ico": "📵",
            "l": "Discreção com eletrônicos e objetos de valor"
          },
          {
            "ico": "🚌",
            "l": "Use transporte de confiança recomendado por hotéis"
          }
        ]
      }
    ]
  },
  "Guyana": {
    "flag": "🇬🇾",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
        "caption": "Georgetown"
      },
      {
        "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
        "caption": "Kaieteur Falls"
      },
      {
        "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70",
        "caption": "Amazônia Guianense"
      }
    ],
    "rotations": [
      0,
      2,
      -1
    ],
    "months": [
      2,
      1,
      1,
      1,
      1,
      2,
      2,
      2,
      1,
      1,
      1,
      2
    ],
    "bestTime": "Fevereiro a abril e agosto a outubro são as estações mais secas. Guiana tem duas temporadas chuvosas por ano.",
    "currency": "Dólar da Guiana (GYD)",
    "symbol": "G$",
    "currencyCode": "GYD",
    "lang": "Inglês",
    "voltage": "120V · Tipo A/B",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. Passaporte obrigatório.",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros por até 30 dias. Passaporte obrigatório.",
    "vaccines": "Febre Amarela obrigatória. Malária e Hepatite A/B recomendadas.",
    "passport": "Passaporte obrigatório.",
    "foods": [
      {
        "e": "🍛",
        "name": "Pepperpot",
        "desc": "Ensopado de carne com cassareep (molho de mandioca fermentada) e especiarias. Prato nacional.",
        "must": true
      },
      {
        "e": "🍚",
        "name": "Cook-Up Rice",
        "desc": "Arroz cozido com feijão, carne ou frutos do mar. Comida de conforto guianense.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Inglês é o idioma oficial — facilita para brasileiros que falam o idioma."
      },
      {
        "e": "⚠️",
        "t": "Georgetown tem problemas de segurança urbana — evite certas áreas à noite."
      },
      {
        "e": "❌",
        "t": "Não subestime a complexidade da entrada na Amazônia guianense — trilhas exigem guia."
      }
    ],
    "vibe": [
      "Exótico",
      "Inglês",
      "Natural",
      "Pouco Visitado"
    ],
    "airport": "GEO",
    "airportCity": "Georgetown",
    "flightHours": "~4–5h",
    "flightBRL": "R$ 1.500–5.000",
    "flightNote": "Via Port of Spain ou Manaus",
    "milesSmiles": "20k–40k",
    "milesAzul": "—",
    "milesLatam": "20k–38k",
    "milesDifficulty": 3,
    "milesDiffNote": "Difícil — poucos voos e rotas diretas.",
    "dailyCost": "R$ 250–600",
    "hotelCost": "R$ 150–500",
    "foodCost": "R$ 40–150",
    "tip": "Cachoeira Kaieteur — 4x maior que as Cataratas do Iguaçu em volume. Praticamente sem turistas. Experiência única.",
    "territories": null,
    "climate": "tropical",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte obrigatório"
          },
          {
            "ico": "💉",
            "l": "Vacinas Febre Amarela e Malária"
          },
          {
            "ico": "🏥",
            "l": "Seguro com evacuação médica"
          }
        ]
      },
      {
        "group": "Natureza",
        "items": [
          {
            "ico": "🦟",
            "l": "Repelente DEET forte (selva densa)"
          },
          {
            "ico": "👟",
            "l": "Bota de borracha para trilhas"
          },
          {
            "ico": "🔦",
            "l": "Lanterna e pilhas extras"
          }
        ]
      }
    ]
  },
  "Suriname": {
    "flag": "🇸🇷",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
        "caption": "Paramaribo"
      },
      {
        "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70",
        "caption": "Amazônia Surinamesa"
      },
      {
        "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
        "caption": "Rio Suriname"
      }
    ],
    "rotations": [
      1,
      -1,
      2
    ],
    "months": [
      2,
      1,
      1,
      1,
      1,
      2,
      2,
      2,
      1,
      1,
      1,
      2
    ],
    "bestTime": "Fevereiro a abril e agosto a outubro são os períodos mais secos.",
    "currency": "Dólar do Suriname (SRD)",
    "symbol": "$",
    "currencyCode": "SRD",
    "lang": "Holandês / Sranan Tongo",
    "voltage": "127V · Tipo F",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. Passaporte + visto obrigatório.",
    "visa": "req",
    "visaText": "Visto <strong>obrigatório</strong> para brasileiros. e-Visa disponível online antes da viagem.",
    "vaccines": "Febre Amarela obrigatória. Malária e Hepatite A/B recomendadas.",
    "passport": "Passaporte obrigatório com 6 meses de validade.",
    "foods": [
      {
        "e": "🍛",
        "name": "Roti Surinamês",
        "desc": "Pão indiano com frango ou feijão ao curry. Herança da diáspora indiana.",
        "must": true
      },
      {
        "e": "🥘",
        "name": "Pom",
        "desc": "Ensopado de pato com inhame ralado. Prato festivo surinamês.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Paramaribo tem centro histórico colonial holandês — Patrimônio UNESCO."
      },
      {
        "e": "⚠️",
        "t": "Holandês é o idioma oficial — mas Sranan Tongo (crioulo) é a língua do dia a dia."
      },
      {
        "e": "❌",
        "t": "Não confunda Suriname com outro país — é uma das nações mais multiculturais do mundo."
      }
    ],
    "vibe": [
      "Multicultural",
      "Exótico",
      "Holandês Tropical",
      "Único"
    ],
    "airport": "PBM",
    "airportCity": "Paramaribo",
    "flightHours": "~4–5h",
    "flightBRL": "R$ 1.500–5.000",
    "flightNote": "Via Port of Spain",
    "milesSmiles": "22k–40k",
    "milesAzul": "—",
    "milesLatam": "22k–40k",
    "milesDifficulty": 3,
    "milesDiffNote": "Destino muito difícil — poucos voos e conexões.",
    "dailyCost": "R$ 250–600",
    "hotelCost": "R$ 150–500",
    "foodCost": "R$ 40–150",
    "tip": "Almoço numa warung (restaurante javanês) em Paramaribo. A culinária surinamesa é a mais surpreendente da América do Sul.",
    "territories": null,
    "climate": "tropical",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte + e-Visa online"
          },
          {
            "ico": "💉",
            "l": "Vacina Febre Amarela (obrigatória)"
          },
          {
            "ico": "🏥",
            "l": "Seguro de viagem"
          }
        ]
      },
      {
        "group": "Saúde",
        "items": [
          {
            "ico": "💊",
            "l": "Profilaxia malária (consulte médico)"
          },
          {
            "ico": "🦟",
            "l": "Repelente DEET forte"
          }
        ]
      }
    ]
  },
  "France": {
    "flag": "🇫🇷",
    "region": "Europa Ocidental",
    "cont": "EU",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=70",
        "caption": "Torre Eiffel"
      },
      {
        "url": "https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&q=70",
        "caption": "Versalhes"
      },
      {
        "url": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=70",
        "caption": "Provence"
      }
    ],
    "rotations": [
      0,
      -2,
      1
    ],
    "months": [
      0,
      0,
      1,
      2,
      2,
      2,
      1,
      1,
      2,
      2,
      1,
      0
    ],
    "bestTime": "Primavera (abr–mai) — jardins floridos, poucas filas. Outono (set–out) — menos turistas, preços menores. Julho–agosto: Paris lotada e quente.",
    "currency": "Euro (EUR)",
    "symbol": "€",
    "currencyCode": "EUR",
    "lang": "Francês",
    "voltage": "230V · Tipo E",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras Schengen abertas.",
    "visa": "req",
    "visaText": "Visto <strong>Schengen obrigatório</strong>. VFS Global, 2–3 meses de antecedência. Taxa: €80. Válido 90 dias em 180.",
    "vaccines": "Sem exigência.",
    "passport": "3 meses de validade além da saída Schengen.",
    "foods": [
      {
        "e": "🥐",
        "name": "Croissant au Beurre",
        "desc": "Massa folhada com manteiga normanda. Na padaria local às 7h30.",
        "must": true
      },
      {
        "e": "🐌",
        "name": "Escargot Bourguignon",
        "desc": "Caracóis com manteiga, alho e salsa. O DNA da cozinha francesa.",
        "must": true
      },
      {
        "e": "🧀",
        "name": "Plateau de Fromages",
        "desc": "Brie, Roquefort, Comté — patrimônio cultural.",
        "must": false
      },
      {
        "e": "🍮",
        "name": "Crème Brûlée",
        "desc": "Creme de baunilha com crosta caramelizada.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Diga 'Bonjour' ao entrar em qualquer estabelecimento."
      },
      {
        "e": "✅",
        "t": "Refeições são rituais — não apresse o garçom."
      },
      {
        "e": "⚠️",
        "t": "Agosto: muitos restaurantes fecham para férias."
      },
      {
        "e": "❌",
        "t": "Não fale alto em restaurantes."
      }
    ],
    "vibe": [
      "Elegante",
      "Artístico",
      "Orgulhoso",
      "Filosófico"
    ],
    "airport": "CDG",
    "airportCity": "Paris",
    "flightHours": "~11h",
    "flightBRL": "R$ 4.500–12.000",
    "flightNote": "Ida e volta, econômica",
    "milesSmiles": "40k–68k",
    "milesAzul": "42k–72k",
    "milesLatam": "40k–65k",
    "milesDifficulty": 2,
    "milesDiffNote": "Alta procura para Paris. Verão e Natal reduzem disponibilidade.",
    "dailyCost": "R$ 950–2.000",
    "hotelCost": "R$ 500–2.000",
    "foodCost": "R$ 120–400",
    "tip": "Croque-monsieur num café de calçada parisiense às 9h. A filosofia gastronômica francesa em um sanduíche.",
    "territories": "🌿 <strong>Guiana Francesa</strong> (América do Sul) e 🏝 <strong>Martinica & Guadalupe</strong> (Caribe) são departamentos ultramarinos — mesmo Euro, mesmo visto Schengen.",
    "climate": "temperate",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte + Visto Schengen"
          },
          {
            "ico": "🏥",
            "l": "Seguro viagem (exigido para Schengen)"
          },
          {
            "ico": "💳",
            "l": "Cartão sem tarifa internacional"
          }
        ]
      },
      {
        "group": "Roupas",
        "items": [
          {
            "ico": "🧥",
            "l": "Casaco impermeável"
          },
          {
            "ico": "👟",
            "l": "Tênis confortável (Paris exige caminhada)"
          },
          {
            "ico": "👗",
            "l": "Roupa elegante para jantares"
          }
        ]
      }
    ]
  },
  "Japan": {
    "flag": "🇯🇵",
    "region": "Ásia Oriental",
    "cont": "AS",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=70",
        "caption": "Fushimi Inari"
      },
      {
        "url": "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&q=70",
        "caption": "Monte Fuji"
      },
      {
        "url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=70",
        "caption": "Shibuya"
      }
    ],
    "rotations": [
      -1,
      2,
      -2
    ],
    "months": [
      0,
      0,
      2,
      2,
      1,
      0,
      0,
      0,
      1,
      2,
      2,
      1
    ],
    "bestTime": "Hanami (cerejeiras, mar–abr) — reserve 6 meses antes. Outono (out–nov) com koyo é igualmente lindo. Verão quente e úmido.",
    "currency": "Iene (JPY)",
    "symbol": "¥",
    "currencyCode": "JPY",
    "lang": "Japonês",
    "voltage": "100V · Tipo A",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. Sem visto para brasileiros (até 15 dias).",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros por até 15 dias.",
    "vaccines": "Hepatite A/B recomendadas.",
    "passport": "6 meses de validade além do retorno.",
    "foods": [
      {
        "e": "🍜",
        "name": "Ramen Tonkotsu",
        "desc": "Caldo de osso 18h+, macarrão fresco, chashu. Fukuoka é o epicentro.",
        "must": true
      },
      {
        "e": "🥩",
        "name": "Wagyu A5",
        "desc": "Marmorização extrema — derrete na boca. Kobe ou Matsusaka.",
        "must": true
      },
      {
        "e": "🍱",
        "name": "Kaiseki",
        "desc": "12–14 pratos contando a história de uma estação. Arte culinária.",
        "must": false
      },
      {
        "e": "🍙",
        "name": "Onigiri Konbini",
        "desc": "Bolinho de arroz no 7-Eleven japonês às 6h. Surpreendentemente saboroso.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Curve levemente a cabeça ao cumprimentar."
      },
      {
        "e": "✅",
        "t": "Receba cartões de visita com as duas mãos."
      },
      {
        "e": "❌",
        "t": "Nunca dê gorjeta — é considerado desrespeitoso."
      },
      {
        "e": "❌",
        "t": "Nunca espete hashi no arroz verticalmente."
      }
    ],
    "vibe": [
      "Preciso",
      "Respeitoso",
      "Silencioso",
      "Eficiente"
    ],
    "airport": "NRT",
    "airportCity": "Tokyo",
    "flightHours": "~24–26h",
    "flightBRL": "R$ 5.500–14.000",
    "flightNote": "Geralmente com escala",
    "milesSmiles": "52k–84k",
    "milesAzul": "55k–88k",
    "milesLatam": "50k–80k",
    "milesDifficulty": 3,
    "milesDiffNote": "Alta demanda. Poucas parcerias diretas. Use LATAM via JAL.",
    "dailyCost": "R$ 680–1.400",
    "hotelCost": "R$ 280–1.200",
    "foodCost": "R$ 60–280",
    "tip": "Kaiseki de 12 pratos num ryokan histórico em Kyoto. A experiência gastronômica mais completa que existe.",
    "territories": null,
    "climate": "temperate",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte válido"
          },
          {
            "ico": "💴",
            "l": "Ienes em espécie (Japão é cash)"
          },
          {
            "ico": "🏥",
            "l": "Seguro de saúde internacional"
          }
        ]
      },
      {
        "group": "Tecnologia",
        "items": [
          {
            "ico": "📶",
            "l": "Pocket WiFi ou SIM japonês"
          },
          {
            "ico": "📱",
            "l": "Suica Card para transporte"
          }
        ]
      },
      {
        "group": "Etiqueta",
        "items": [
          {
            "ico": "👟",
            "l": "Tênis sem cadarço (remove frequentemente)"
          },
          {
            "ico": "🧦",
            "l": "Meias sem furos (remove em tatamis)"
          }
        ]
      }
    ]
  },
  "United States of America": {
    "flag": "🇺🇸",
    "region": "América do Norte",
    "cont": "NA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&q=70",
        "caption": "Nova York"
      },
      {
        "url": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=70",
        "caption": "Grand Canyon"
      },
      {
        "url": "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400&q=70",
        "caption": "San Francisco"
      }
    ],
    "rotations": [
      1,
      -2,
      0
    ],
    "months": [
      1,
      1,
      2,
      2,
      2,
      2,
      1,
      1,
      2,
      2,
      1,
      1
    ],
    "bestTime": "Primavera (abr–mai) e outono (set–out) são os melhores períodos. Verão é movimentado e caro. Inverno ótimo para neve ou sol na Flórida.",
    "currency": "Dólar Americano (USD)",
    "symbol": "US$",
    "currencyCode": "USD",
    "lang": "Inglês",
    "voltage": "120V · Tipo A/B",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. Visto B1/B2 obrigatório para brasileiros.",
    "visa": "req",
    "visaText": "Visto <strong>B1/B2 obrigatório</strong>. Taxa: US$185. Entrevista na Embaixada. Processo: 2–10 semanas.",
    "vaccines": "Sem exigência.",
    "passport": "6 meses de validade além do retorno.",
    "foods": [
      {
        "e": "🥩",
        "name": "Texas BBQ",
        "desc": "Brisket defumado 12–18h. Austin, TX é a capital mundial.",
        "must": true
      },
      {
        "e": "🦞",
        "name": "Lobster Roll",
        "desc": "Lagosta fresca com manteiga em pão brioche. Maine e Cape Cod.",
        "must": true
      },
      {
        "e": "🍕",
        "name": "Deep Dish Pizza",
        "desc": "Pizza estilo torta com recheio generoso. Exclusivamente chicagoana.",
        "must": false
      },
      {
        "e": "🍔",
        "name": "Smash Burger",
        "desc": "Blend prensado na chapa, queijo americano, picles.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Gorjeta de 18–22% é OBRIGATÓRIA."
      },
      {
        "e": "✅",
        "t": "Small talk com estranhos é normal."
      },
      {
        "e": "⚠️",
        "t": "Política divide americanos — evite em reuniões sociais."
      },
      {
        "e": "❌",
        "t": "Nunca deixe de dar gorjeta."
      }
    ],
    "vibe": [
      "Dinâmico",
      "Diverso",
      "Ambicioso",
      "Direto"
    ],
    "airport": "MIA",
    "airportCity": "Miami / Nova York",
    "flightHours": "~10h",
    "flightBRL": "R$ 3.200–8.500",
    "flightNote": "Ida e volta, econômica",
    "milesSmiles": "35k–60k",
    "milesAzul": "38k–65k",
    "milesLatam": "35k–58k",
    "milesDifficulty": 2,
    "milesDiffNote": "Muitos assentos mas alta demanda. Reserve 4–6 meses antes.",
    "dailyCost": "R$ 980–2.400",
    "hotelCost": "R$ 600–1.800",
    "foodCost": "R$ 120–350",
    "tip": "Smash burger num diner local às 2h da manhã depois de uma noite em Nova York.",
    "territories": null,
    "climate": "varied",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte + Visto B1/B2"
          },
          {
            "ico": "🏥",
            "l": "Seguro de saúde OBRIGATÓRIO (caro sem ele)"
          },
          {
            "ico": "💳",
            "l": "Cartão com chip e senha"
          }
        ]
      },
      {
        "group": "Roupas",
        "items": [
          {
            "ico": "🧥",
            "l": "Casaco para AC intenso"
          },
          {
            "ico": "👟",
            "l": "Tênis para caminhar muito"
          }
        ]
      }
    ]
  },
  "Egypt": {
    "flag": "🇪🇬",
    "region": "Norte da África",
    "cont": "AF",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1539650116574-75e09e35e6c3?w=400&q=70",
        "caption": "Pirâmides de Gizé"
      },
      {
        "url": "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&q=70",
        "caption": "Luxor"
      },
      {
        "url": "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=400&q=70",
        "caption": "Mar Vermelho"
      }
    ],
    "rotations": [
      1,
      -1,
      2
    ],
    "months": [
      2,
      2,
      2,
      1,
      0,
      0,
      0,
      0,
      1,
      2,
      2,
      2
    ],
    "bestTime": "Outubro a março — 20–28°C para pirâmides. Verão: Cairo bate 40–46°C. Ramadã muda a dinâmica do país.",
    "currency": "Libra Egípcia (EGP)",
    "symbol": "£E",
    "currencyCode": "EGP",
    "lang": "Árabe",
    "voltage": "220V · Tipo C/F",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Fronteiras abertas. e-Visa obrigatória.",
    "visa": "cond",
    "visaText": "<strong>e-Visa online</strong> — USD 25. Aprovação em 3–7 dias. Válida 30 dias após chegada.",
    "vaccines": "Febre Amarela se vier de zona endêmica. Hepatite A e Febre Tifoide recomendadas.",
    "passport": "6 meses de validade além da entrada.",
    "foods": [
      {
        "e": "🍚",
        "name": "Koshari",
        "desc": "Lentilha, macarrão, arroz, molho de tomate picante. O prato nacional.",
        "must": true
      },
      {
        "e": "🫘",
        "name": "Ful Medames",
        "desc": "Feijão-fava com azeite e cominho. Café da manhã há 5.000 anos.",
        "must": true
      },
      {
        "e": "🥘",
        "name": "Molokhia",
        "desc": "Sopa de folhas de juta sobre arroz e frango. Sabor ancestral.",
        "must": false
      },
      {
        "e": "🥐",
        "name": "Feteer",
        "desc": "Massa folhada egípcia com mel ou queijo. Exclusividade egípcia.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Regateio em souks — sorria e o preço cai 40–70%."
      },
      {
        "e": "⚠️",
        "t": "Ramadã: evite comer em público durante o dia."
      },
      {
        "e": "❌",
        "t": "Nunca fotografe militares ou instalações sem permissão."
      }
    ],
    "vibe": [
      "Milenar",
      "Caótico",
      "Hospitaleiro",
      "Espiritual"
    ],
    "airport": "CAI",
    "airportCity": "Cairo",
    "flightHours": "~12–14h",
    "flightBRL": "R$ 4.200–10.500",
    "flightNote": "Conexão em Europa ou Doha",
    "milesSmiles": "50k–78k",
    "milesAzul": "52k–80k",
    "milesLatam": "48k–76k",
    "milesDifficulty": 2,
    "milesDiffNote": "Disponibilidade irregular. Conexões via Europa ou Qatar.",
    "dailyCost": "R$ 230–580",
    "hotelCost": "R$ 100–500",
    "foodCost": "R$ 25–100",
    "tip": "Koshari num restaurante sem placa no Cairo por EGP 20 (~R$3). O melhor comfort food do planeta.",
    "territories": null,
    "climate": "desert",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte + e-Visa impressa"
          },
          {
            "ico": "💵",
            "l": "Dólares para câmbio local"
          },
          {
            "ico": "🏥",
            "l": "Seguro de saúde"
          }
        ]
      },
      {
        "group": "Roupas (Deserto)",
        "items": [
          {
            "ico": "👕",
            "l": "Manga longa folgada (sol intenso)"
          },
          {
            "ico": "🧢",
            "l": "Chapéu e óculos de sol"
          },
          {
            "ico": "🧴",
            "l": "Protetor solar FPS 70+"
          }
        ]
      },
      {
        "group": "Higiene",
        "items": [
          {
            "ico": "🚰",
            "l": "NUNCA beba água da torneira"
          },
          {
            "ico": "💊",
            "l": "Remédio para estômago (obrigatório)"
          }
        ]
      }
    ]
  },
  "Thailand": {
    "flag": "🇹🇭",
    "region": "Sudeste Asiático",
    "cont": "AS",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=400&q=70",
        "caption": "Wat Pho"
      },
      {
        "url": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=70",
        "caption": "Ilhas do Sul"
      },
      {
        "url": "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=400&q=70",
        "caption": "Chiang Mai"
      }
    ],
    "rotations": [
      -2,
      0,
      1
    ],
    "months": [
      2,
      2,
      2,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      2,
      2
    ],
    "bestTime": "Novembro a fevereiro — seca e fresca, perfeita para todo o país. Maio–outubro: monção intensa.",
    "currency": "Baht (THB)",
    "symbol": "฿",
    "currencyCode": "THB",
    "lang": "Tailandês",
    "voltage": "220V · Tipo A/B/C",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Sem visto para brasileiros (30 dias).",
    "visa": "free",
    "visaText": "<strong>Isento de visto</strong> para brasileiros por 30 dias.",
    "vaccines": "Febre Amarela se vier de zona endêmica. Hepatite A/B e Raiva recomendadas.",
    "passport": "6 meses de validade além da entrada.",
    "foods": [
      {
        "e": "🍜",
        "name": "Pad Thai",
        "desc": "Macarrão de arroz com camarão, tofu, brotos e amendoim.",
        "must": true
      },
      {
        "e": "🍛",
        "name": "Massaman Curry",
        "desc": "Eleito o prato mais gostoso do mundo pelo CNN Travel.",
        "must": true
      },
      {
        "e": "🥗",
        "name": "Som Tam",
        "desc": "Papaia verde com pimenta, limão e molho de peixe.",
        "must": true
      },
      {
        "e": "🍚",
        "name": "Khao Man Gai",
        "desc": "Frango sobre arroz. Café da manhã de mercado. ~R$8.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Wai (palmas juntas + cabeça curvada) é o cumprimento."
      },
      {
        "e": "⚠️",
        "t": "Descalce-se em templos, casas e alguns restaurantes."
      },
      {
        "e": "❌",
        "t": "Nunca toque a cabeça de ninguém."
      },
      {
        "e": "❌",
        "t": "Desrespeito à família real é crime com pena de prisão."
      }
    ],
    "vibe": [
      "Espiritual",
      "Sorridento",
      "Colorido",
      "Picante"
    ],
    "airport": "BKK",
    "airportCity": "Bangkok",
    "flightHours": "~22–24h",
    "flightBRL": "R$ 4.800–13.000",
    "flightNote": "Geralmente com escala",
    "milesSmiles": "54k–90k",
    "milesAzul": "56k–92k",
    "milesLatam": "52k–86k",
    "milesDifficulty": 2,
    "milesDiffNote": "Disponibilidade razoável via Singapore ou Thai Airways.",
    "dailyCost": "R$ 280–750",
    "hotelCost": "R$ 100–600",
    "foodCost": "R$ 25–120",
    "tip": "Street food de Bangkok é Patrimônio da UNESCO. Vá com estômago vazio.",
    "territories": null,
    "climate": "tropical",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte válido"
          },
          {
            "ico": "🏥",
            "l": "Seguro de saúde"
          },
          {
            "ico": "💵",
            "l": "Bahts em espécie"
          }
        ]
      },
      {
        "group": "Roupas",
        "items": [
          {
            "ico": "👕",
            "l": "Roupas leves e de secagem rápida"
          },
          {
            "ico": "🧣",
            "l": "Lenço para cobrir ombros em templos"
          },
          {
            "ico": "🧴",
            "l": "Protetor solar e repelente DEET"
          }
        ]
      },
      {
        "group": "Tecnologia",
        "items": [
          {
            "ico": "📱",
            "l": "SIM tailandês (AIS/DTAC)"
          },
          {
            "ico": "🚖",
            "l": "Grab App instalado"
          }
        ]
      }
    ]
  },
  "Fr. Guiana": {
    "flag": "🇬🇫",
    "region": "América do Sul",
    "cont": "SA",
    "photos": [
      {
        "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70",
        "caption": "Amazônia Guianense"
      }
    ],
    "rotations": [
      0
    ],
    "months": [
      2,
      1,
      1,
      1,
      2,
      2,
      2,
      1,
      1,
      1,
      2,
      2
    ],
    "bestTime": "Fevereiro a abril e agosto a novembro são as estações mais secas. Clima equatorial com chuvas intensas.",
    "currency": "Euro (EUR)",
    "symbol": "€",
    "currencyCode": "EUR",
    "lang": "Francês",
    "voltage": "230V · Tipo E/F",
    "conflict": null,
    "borderStatus": "open",
    "borderNote": "Departamento ultramarino da França. Passaporte ou visto Schengen.",
    "visa": "req",
    "visaText": "<strong>Visto Schengen obrigatório</strong> para brasileiros — mesmas regras que a França metropolitana.",
    "vaccines": "Febre Amarela <strong>obrigatória</strong> para entrada. Malária e Hepatite A/B recomendadas.",
    "passport": "Passaporte com 3 meses de validade além da saída da área Schengen.",
    "foods": [
      {
        "e": "🦀",
        "name": "Bouillon d'Awara",
        "desc": "Sopa de dendê com carne defumada, frutos do mar e legumes. Prato festivo da Páscoa guianense.",
        "must": true
      },
      {
        "e": "🍌",
        "name": "Accras de Morue",
        "desc": "Bolinhos fritos de bacalhau com pimenta. Herança antilhana.",
        "must": false
      }
    ],
    "etiquette": [
      {
        "e": "✅",
        "t": "Francês é obrigatório — inglês e espanhol têm alcance muito limitado."
      },
      {
        "e": "⚠️",
        "t": "Território francês com leis francesas — porte de certas substâncias é proibido."
      },
      {
        "e": "❌",
        "t": "Não entre na selva sem guia habilitado — risco real de perder-se."
      }
    ],
    "vibe": [
      "Exótico",
      "Francês Tropical",
      "Biodiverso",
      "Único"
    ],
    "airport": "CAY",
    "airportCity": "Caiena",
    "flightHours": "~5h",
    "flightBRL": "R$ 2.500–7.000",
    "flightNote": "Via Paris ou Fort-de-France",
    "milesSmiles": "28k–50k",
    "milesAzul": "—",
    "milesLatam": "28k–48k",
    "milesDifficulty": 2,
    "milesDiffNote": "Emissão via Paris possível. Poucos voos diretos do Brasil.",
    "dailyCost": "R$ 600–1.400",
    "hotelCost": "R$ 350–900",
    "foodCost": "R$ 80–250",
    "tip": "Amazônia francesa praticamente intocada. O Parc Amazonien de Guyane é o maior parque nacional da EU.",
    "territories": "🇫🇷 Departamento ultramarino da <strong>França</strong> desde 1946. Usa Euro, tem eleições francesas e representação no Parlamento Europeu.",
    "climate": "tropical",
    "checklist": [
      {
        "group": "Documentos",
        "items": [
          {
            "ico": "📘",
            "l": "Passaporte + Visto Schengen válido"
          },
          {
            "ico": "💉",
            "l": "Cartão de Vacina Febre Amarela (OBRIGATÓRIO)"
          },
          {
            "ico": "🏥",
            "l": "Seguro de saúde internacional"
          }
        ]
      },
      {
        "group": "Saúde CRÍTICO",
        "items": [
          {
            "ico": "💊",
            "l": "Profilaxia de malária (consulte médico)"
          },
          {
            "ico": "🦟",
            "l": "Repelente DEET 30%+ (mosquitos intensos)"
          },
          {
            "ico": "💧",
            "l": "Água mineral — evite torneira na selva"
          }
        ]
      }
    ]
  }
});

export const SOUTH_AMERICA_MEDIA = Object.freeze({
  "Brazil": [
    {
      "url": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=70",
      "city": "Rio de Janeiro"
    },
    {
      "url": "https://images.unsplash.com/photo-1554188248-986adbb73be4?w=400&q=70",
      "city": "Manaus"
    },
    {
      "url": "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=400&q=70",
      "city": "Rio de Janeiro"
    }
  ],
  "Argentina": [
    {
      "url": "https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=400&q=70",
      "city": "Buenos Aires"
    },
    {
      "url": "https://images.unsplash.com/photo-1531590878845-12627191e687?w=400&q=70",
      "city": "El Calafate"
    },
    {
      "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70",
      "city": "Mendoza"
    }
  ],
  "Chile": [
    {
      "url": "https://images.unsplash.com/photo-1531590878845-12627191e687?w=400&q=70",
      "city": "Puerto Natales"
    },
    {
      "url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=70",
      "city": "San Pedro de Atacama"
    },
    {
      "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70",
      "city": "Santiago"
    }
  ],
  "Peru": [
    {
      "url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&q=70",
      "city": "Cusco"
    },
    {
      "url": "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&q=70",
      "city": "Lima"
    },
    {
      "url": "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=70",
      "city": "Puno"
    }
  ],
  "Colombia": [
    {
      "url": "https://images.unsplash.com/photo-1558618047-3c5dc9c7c5f1?w=400&q=70",
      "city": "Cartagena"
    },
    {
      "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70",
      "city": "Medellín"
    },
    {
      "url": "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&q=70",
      "city": "Pereira"
    }
  ],
  "Uruguay": [
    {
      "url": "https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=400&q=70",
      "city": "Montevidéu"
    },
    {
      "url": "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=400&q=70",
      "city": "Punta del Este"
    },
    {
      "url": "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=400&q=70",
      "city": "Colonia del Sacramento"
    }
  ],
  "Paraguay": [
    {
      "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
      "city": "Assunção"
    },
    {
      "url": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=70",
      "city": "Encarnación"
    },
    {
      "url": "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&q=70",
      "city": "Fuerte Olimpo"
    }
  ],
  "Bolivia": [
    {
      "url": "https://images.unsplash.com/photo-1583244532610-2c49e76c87ca?w=400&q=70",
      "city": "Uyuni"
    },
    {
      "url": "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&q=70",
      "city": "La Paz"
    },
    {
      "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
      "city": "Copacabana"
    }
  ],
  "Ecuador": [
    {
      "url": "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=70",
      "city": "Puerto Ayora"
    },
    {
      "url": "https://images.unsplash.com/photo-1547222526-3e2ab0c3e1e1?w=400&q=70",
      "city": "Quito"
    },
    {
      "url": "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=400&q=70",
      "city": "Latacunga"
    }
  ],
  "Venezuela": [
    {
      "url": "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=400&q=70",
      "city": "Canaima"
    },
    {
      "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
      "city": "Caracas"
    },
    {
      "url": "https://images.unsplash.com/photo-1558618047-3c5dc9c7c5f1?w=400&q=70",
      "city": "Santa Elena de Uairén"
    }
  ],
  "Guyana": [
    {
      "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
      "city": "Georgetown"
    },
    {
      "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
      "city": "Mahdia"
    },
    {
      "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70",
      "city": "Georgetown"
    }
  ],
  "Suriname": [
    {
      "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
      "city": "Paramaribo"
    },
    {
      "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70",
      "city": "Paramaribo"
    },
    {
      "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
      "city": "Paramaribo"
    }
  ],
  "Fr. Guiana": [
    {
      "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70",
      "city": "Cayenne"
    }
  ]
});

export const BASE_CHECKLIST = Object.freeze([
  { group: 'Documentos', items: [
    { icon: '📘', label: 'Passaporte dentro da validade exigida pelo destino' },
    { icon: '🏥', label: 'Seguro viagem com cobertura internacional' },
    { icon: '🛂', label: 'Confirmar visto e regras de entrada em fonte oficial' }
  ] },
  { group: 'Saúde', items: [
    { icon: '💉', label: 'Conferir vacinas exigidas e recomendadas' },
    { icon: '💊', label: 'Levar medicamentos de uso pessoal com receita, se aplicável' }
  ] },
  { group: 'Viagem', items: [
    { icon: '💳', label: 'Cartão habilitado para uso internacional' },
    { icon: '📱', label: 'Salvar reservas e documentos também offline' },
    { icon: '🔌', label: 'Confirmar tomada e voltagem antes de embarcar' }
  ] }
]);

export function normalizeLookupKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeChecklist(source) {
  return (source ?? BASE_CHECKLIST).map(group => ({
    group: group.group,
    items: (group.items ?? []).map(item => ({
      icon: item.icon ?? item.ico ?? '•',
      label: item.label ?? item.l ?? ''
    }))
  }));
}

function baseCountry(key, meta) {
  const timezones = meta.timezones ?? [];
  return {
    key,
    alpha2: meta.alpha2,
    namePt: meta.namePt,
    flag: meta.flag,
    capital: meta.capital,
    region: meta.region,
    continent: meta.cont,
    latlng: meta.latlng,
    currencyCode: meta.currencyCode ?? null,
    currency: meta.currencyCode ? `${meta.currencyName} (${meta.currencyCode})` : meta.currencyName,
    symbol: meta.symbol ?? meta.currencyCode ?? '—',
    lang: (meta.languages ?? []).join(' / '),
    timezoneLabel: timezones.slice(0, 3).join(' · ') + (timezones.length > 3 ? ' +' : ''),
    timezones,
    voltage: 'Confirme o padrão elétrico local antes da viagem',
    photos: [],
    months: Array(12).fill(1),
    bestTime: 'A melhor época depende da região, clima, feriados e objetivo da viagem.',
    conflict: null,
    borderStatus: 'check',
    borderNote: 'Regras de entrada podem mudar.',
    visa: 'cond',
    visaText: 'Confirme exigência de visto e prazo de permanência em fonte consular oficial antes da compra da passagem.',
    vaccines: 'Confirme vacinas exigidas e recomendações sanitárias em fontes oficiais.',
    passport: 'Confirme validade mínima exigida e necessidade de páginas livres.',
    foods: [{ e: '🍽️', name: `Culinária de ${meta.namePt}`, desc: 'Explore pratos regionais e mercados locais.', must: false }],
    etiquette: [{ e: 'ℹ️', t: 'Respeite costumes locais, regras de vestimenta e normas de fotografia.' }],
    vibe: ['Descoberta', 'Cultura local'],
    airport: null,
    airportCity: meta.capital,
    climate: 'varied',
    checklist: normalizeChecklist(BASE_CHECKLIST),
    dataLevel: 'base'
  };
}

/**
 * Regional enrichment for the Americas.
 * Stable geographic metadata and hub-airport identifiers are bundled locally.
 * Dynamic border/visa/health rules are deliberately not asserted here.
 * External media is tagged separately because asset subject verification requires
 * an online validation pass; this build does not pretend runtime availability = subject verification.
 */
export const AMERICAS_ENRICHMENT = Object.freeze({
  "Bolivia": {
    landmarks: [
      {
        name: "Basílica de Nossa Senhora de Copacabana",
        city: "Copacabana",
        country: "Bolívia",
        coordinates: [-16.1667, -69.0833],
        disambiguation: "Copacabana, departamento de La Paz, Bolívia, às margens do Lago Titicaca; não é Copacabana, Rio de Janeiro, Brasil."
      }
    ]
  },
  "United States of America": {
    region: "América do Norte",
    airport: "JFK",
    airportCity: "Nova York",
    majorAirports: ["JFK", "LAX", "ORD", "ATL", "MIA"],
    landmarks: [
      { name: "Statue of Liberty", city: "Nova York", country: "Estados Unidos" },
      { name: "Golden Gate Bridge", city: "San Francisco", country: "Estados Unidos" }
    ]
  },
  "Canada": {
    region: "América do Norte",
    airport: "YYZ",
    airportCity: "Toronto",
    majorAirports: ["YYZ", "YVR"],
    landmarks: [{ name: "CN Tower", city: "Toronto", country: "Canadá" }]
  },
  "Mexico": {
    region: "América do Norte",
    airport: "MEX",
    airportCity: "Cidade do México",
    majorAirports: ["MEX"],
    landmarks: [{ name: "Palacio de Bellas Artes", city: "Cidade do México", country: "México" }]
  },
  "Belize": {
    region: "América Central",
    airport: "BZE",
    airportCity: "Belize City",
    majorAirports: ["BZE"],
    landmarks: [{ name: "St. John's Cathedral", city: "Belize City", country: "Belize" }]
  },
  "Costa Rica": {
    region: "América Central",
    airport: "SJO",
    airportCity: "San José",
    majorAirports: ["SJO"],
    landmarks: [{ name: "Teatro Nacional de Costa Rica", city: "San José", country: "Costa Rica" }]
  },
  "El Salvador": {
    region: "América Central",
    airport: "SAL",
    airportCity: "San Salvador",
    majorAirports: ["SAL"],
    landmarks: [{ name: "Catedral Metropolitana", city: "San Salvador", country: "El Salvador" }]
  },
  "Guatemala": {
    region: "América Central",
    airport: "GUA",
    airportCity: "Cidade da Guatemala",
    majorAirports: ["GUA"],
    landmarks: [{ name: "Arco de Santa Catalina", city: "Antigua Guatemala", country: "Guatemala" }]
  },
  "Honduras": {
    region: "América Central",
    airport: "SAP",
    airportCity: "San Pedro Sula",
    majorAirports: ["SAP"],
    landmarks: [{ name: "Sítio arqueológico de Copán", city: "Copán Ruinas", country: "Honduras" }]
  },
  "Nicaragua": {
    region: "América Central",
    airport: "MGA",
    airportCity: "Manágua",
    majorAirports: ["MGA"],
    landmarks: [{ name: "Catedral de León", city: "León", country: "Nicarágua" }]
  },
  "Panama": {
    region: "América Central",
    airport: "PTY",
    airportCity: "Cidade do Panamá",
    majorAirports: ["PTY"],
    landmarks: [{ name: "Eclusas de Miraflores", city: "Cidade do Panamá", country: "Panamá" }]
  },
  ...CENTRAL_AMERICA_ENRICHMENT,
  ...SOUTH_AMERICA_ENRICHMENT
});

/**
 * Media candidates already present in the project. `verifiedInSession` is false
 * because this environment has no web access to verify the subject/source now.
 * The UI only overlays `city`; landmark/description metadata never appears over images.
 */
export const LANDMARK_MEDIA = Object.freeze({
  ...SOUTH_AMERICA_MEDIA,
  // Deliberately excludes the old ambiguous Copacabana beach candidate.
  // Copacabana, Bolivia is modeled above as the Lake Titicaca city/basilica landmark.
  "Bolivia": [
    { url: "https://images.unsplash.com/photo-1583244532610-2c49e76c87ca?w=400&q=70", city: "Uyuni", verifiedInSession: false },
    { url: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&q=70", city: "La Paz", verifiedInSession: false }
  ],
  "United States of America": [
    { url: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&q=70", city: "Nova York", verifiedInSession: false },
    { url: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400&q=70", city: "San Francisco", verifiedInSession: false }
  ]
});

export const COUNTRIES = Object.freeze(Object.fromEntries(
  Object.entries(COUNTRY_CATALOG).map(([key, meta]) => {
    const base = baseCountry(key, meta);
    const curated = CURATED_COUNTRIES[key] ?? null;
    const regional = AMERICAS_ENRICHMENT[key] ?? null;
    if (!curated && !regional) return [key, base];
    const merged = { ...base, ...(curated ?? {}), ...(regional ?? {}) };
    return [key, {
      ...merged,
      key,
      continent: merged.cont ?? base.continent,
      latlng: merged.latlng ?? base.latlng,
      capital: merged.capital ?? base.capital,
      alpha2: merged.alpha2 ?? base.alpha2,
      namePt: merged.namePt ?? base.namePt,
      timezoneLabel: merged.timezoneLabel ?? base.timezoneLabel,
      visaPolicyBR: merged.visaPolicyBR ?? {
        eligibility: merged.visa === 'free' ? 'visa-free' : 'unknown',
        detail: merged.visaText ?? 'Confirme o requisito de visto em fonte consular oficial antes da viagem.'
      },
      checklist: normalizeChecklist(merged.checklist),
      dataLevel: curated || merged.dataLevel === 'curated' ? 'curated' : 'regional'
    }];
  })
));

export function resolveCountryKey(value) {
  const normalized = normalizeLookupKey(value);
  if (!normalized) return null;
  return COUNTRY_ALIASES[normalized] ?? null;
}

export function searchCountries(query, limit = 8) {
  const normalized = normalizeLookupKey(query);
  if (!normalized) return [];
  const exact = resolveCountryKey(normalized);
  const scored = [];
  for (const [key, country] of Object.entries(COUNTRIES)) {
    const candidates = [key, country.namePt, country.alpha2].map(normalizeLookupKey);
    let score = 0;
    if (key === exact) score += 100;
    for (const candidate of candidates) {
      if (candidate === normalized) score = Math.max(score, 90);
      else if (candidate.startsWith(normalized)) score = Math.max(score, 70);
      else if (candidate.includes(normalized)) score = Math.max(score, 45);
    }
    if (score) scored.push({ key, score, label: country.namePt });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'pt-BR'))
    .slice(0, limit)
    .map(item => item.key);
}
