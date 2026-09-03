// Universal Hindi <-> English Phonetic Transliteration & Translation Engine

const wordDictionary = {
  // Common Names
  'anant': 'अनंत',
  'अनंत': 'Anant',
  'ramesh': 'रमेश',
  'रमेश': 'Ramesh',
  'kumar': 'कुमार',
  'कुमार': 'Kumar',
  'suresh': 'सुरेश',
  'सुरेश': 'Suresh',
  'sharma': 'शर्मा',
  'शर्मा': 'Sharma',
  'rajesh': 'राजेश',
  'राजेश': 'Rajesh',
  'singh': 'सिंह',
  'सिंह': 'Singh',
  'anil': 'अनिल',
  'अनिल': 'Anil',
  'verma': 'वर्मा',
  'वर्मा': 'Verma',
  'vikas': 'विकास',
  'विकास': 'Vikas',
  'patel': 'पटेल',
  'पटेल': 'Patel',
  'shreyash': 'श्रेयश',
  'श्रेयश': 'Shreyash',

  // Locations & Cities & States (Exact mappings)
  'ludhiana': 'लुधियाना',
  'ludhiyana': 'लुधियाना',
  'लुधियाना': 'Ludhiana',
  'लुधिन': 'Ludhiana',
  'punjab': 'पंजाब',
  'पंजाब': 'Punjab',
  'ludhiana, punjab': 'लुधियाना, पंजाब',
  'ludhiyana, punjab': 'लुधियाना, पंजाब',
  'लुधियाना, पंजाब': 'Ludhiana, Punjab',
  'amritsar': 'अमृतसर',
  'अमृतसर': 'Amritsar',
  'jalandhar': 'जालंधर',
  'जालंधर': 'Jalandhar',
  'patiala': 'पटियाला',
  'पटियाला': 'Patiala',
  'bathinda': 'बठिंडा',
  'बठिंडा': 'Bathinda',
  'karnal': 'करनाल',
  'करनाल': 'Karnal',
  'hisar': 'हिसार',
  'हिसार': 'Hisar',
  'ambala': 'अम्बाला',
  'अम्बाला': 'Ambala',
  'panipat': 'पानीपत',
  'पानीपत': 'Panipat',
  'rohtak': 'रोहतक',
  'रोहतक': 'Rohtak',
  'lucknow': 'लखनऊ',
  'लखनऊ': 'Lucknow',
  'kanpur': 'कानपुर',
  'कानपुर': 'Kanpur',
  'varanasi': 'वाराणसी',
  'वाराणसी': 'Varanasi',
  'agra': 'आगरा',
  'आगरा': 'Agra',
  'meerut': 'मेरठ',
  'मेरठ': 'Meerut',
  'pune': 'पुणे',
  'पुणे': 'Pune',
  'nagpur': 'नागपुर',
  'नागपुर': 'Nagpur',
  'nashik': 'नाशिक',
  'नाशिक': 'Nashik',
  'india': 'भारत',
  'भारत': 'India',
  'haryana': 'हरियाणा',
  'हरियाणा': 'Haryana',
  'rajasthan': 'राजस्थान',
  'राजस्थान': 'Rajasthan',
  'uttar pradesh': 'उत्तर प्रदेश',
  'उत्तर प्रदेश': 'Uttar Pradesh',
  'madhya pradesh': 'मध्य प्रदेश',
  'मध्य प्रदेश': 'Madhya Pradesh',
  'maharashtra': 'महाराष्ट्र',
  'महाराष्ट्र': 'Maharashtra',
  'jaipur': 'जयपुर',
  'जयपुर': 'Jaipur',
  'jaipur, rajasthan': 'जयपुर, राजस्थान',
  'जयपुर, राजस्थान': 'Jaipur, Rajasthan',
  'delhi': 'दिल्ली',
  'दिल्ली': 'Delhi',

  // Farms, Fields & Common Agrarian Terms
  'khet': 'खेत',
  'खेत': 'Khet',
  'field': 'खेत',
  'farm': 'फार्म',
  'फार्म': 'Farm',
  'khet1': 'खेत 1',
  'khet2': 'खेत 2',
  'khet3': 'खेत 3',
  'khet4': 'खेत 4',
  'khet5': 'खेत 5',
  'khet 1': 'खेत 1',
  'khet 2': 'खेत 2',
  'khet 3': 'खेत 3',
  'khet 4': 'खेत 4',
  'khet 5': 'खेत 5',
  'खेत 1': 'Khet 1',
  'खेत 2': 'Khet 2',
  'खेत 3': 'Khet 3',
  'खेत 4': 'Khet 4',
  'खेत 5': 'Khet 5',
  'farm 1': 'फार्म 1',
  'farm 2': 'फार्म 2',
  'farm 3': 'फार्म 3',
  'फार्म 1': 'Farm 1',
  'फार्म 2': 'Farm 2',
  'north field': 'उत्तरी खेत',
  'south field': 'दक्षिणी खेत',
  'east field': 'पूर्वी खेत',
  'west field': 'पश्चिमी खेत',
  'main field': 'मुख्य खेत',
  'home field': 'घरेलू खेत',

  // Crops
  'wheat': 'गेहूं',
  'गेहूं': 'Wheat',
  'rice': 'धान',
  'paddy': 'धान',
  'धान': 'Rice',
  'cotton': 'कपास',
  'कपास': 'Cotton',
  'mustard': 'सरसों',
  'सरसों': 'Mustard',
  'tomato': 'टमाटर',
  'टमाटर': 'Tomato',
  'potato': 'आलू',
  'आलू': 'Potato',
  'maize': 'मक्का',
  'मक्का': 'Maize',
  'sugarcane': 'गन्ना',
  'गन्ना': 'Sugarcane',
  'gram': 'चना',
  'chana': 'चना',
  'चना': 'Gram',
  'soybean': 'सोयाबीन',
  'सोयाबीन': 'Soybean',
  'onion': 'प्याज',
  'प्याज': 'Onion',
  'chilli': 'मिर्च',
  'chili': 'मिर्च',
  'मिर्च': 'Chilli',

  // Soil & Irrigation Types
  'alluvial': 'जलोढ़ मिट्टी',
  'जलोढ़ मिट्टी': 'Alluvial Soil',
  'black': 'काली मिट्टी',
  'काली मिट्टी': 'Black Soil',
  'red': 'लाल मिट्टी',
  'लाल मिट्टी': 'Red Soil',
  'sandy loam': 'बलुई दोमट मिट्टी',
  'clay loam': 'चिकनी दोमट मिट्टी',
  'canal': 'नहरी सिंचाई',
  'नहरी सिंचाई': 'Canal Irrigation',
  'drip': 'ड्रिप सिंचाई',
  'ड्रिप सिंचाई': 'Drip Irrigation',
  'sprinkler': 'फव्वारा सिंचाई',
  'फव्वारा सिंचाई': 'Sprinkler Irrigation',
  'tubewell': 'नलकूप / बोरवेल',
  'borewell': 'नलकूप / बोरवेल',
  'acres': 'एकड़',
  'एकड़': 'Acres',
  'hectares': 'हेक्टेयर',
  'हेक्टेयर': 'Hectares',
  'bigha': 'बीघा',
  'बीघा': 'Bigha',
  'sq_km': 'वर्ग किमी',
  'sq km': 'वर्ग किमी',
  'sq. km': 'वर्ग किमी',
  'km': 'किमी',
  'वर्ग किमी': 'Sq. Km',
  'वर्ग किलोमीटर': 'Sq. Km',
  'किमी': 'Km'
}

// Helper to translate farm name pattern like "khet 1" or "khet12" or "farm3"
function translateFarmPattern(str, targetLang) {
  const clean = str.trim()
  const lower = clean.toLowerCase()

  if (targetLang === 'hi') {
    const khetMatch = lower.match(/^khet\s*(\d+)$/)
    if (khetMatch) return `खेत ${khetMatch[1]}`

    const farmMatch = lower.match(/^farm\s*(\d+)$/)
    if (farmMatch) return `फार्म ${farmMatch[1]}`

    const fieldMatch = lower.match(/^field\s*(\d+)$/)
    if (fieldMatch) return `खेत ${fieldMatch[1]}`
  } else {
    const khetHiMatch = clean.match(/^खेत\s*(\d+)$/)
    if (khetHiMatch) return `Khet ${khetHiMatch[1]}`

    const farmHiMatch = clean.match(/^फार्म\s*(\d+)$/)
    if (farmHiMatch) return `Farm ${farmHiMatch[1]}`
  }

  return null
}

// 1. Devanagari to English Converter
function devanagariToEnglish(str) {
  const consonants = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
    'ष': 'sh', 'स': 's', 'ह': 'h', 'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy'
  }

  const vowels = {
    'अ': 'A', 'आ': 'Aa', 'इ': 'I', 'ई': 'Ee', 'उ': 'U', 'ऊ': 'Oo',
    'ऋ': 'Ri', 'ए': 'E', 'ऐ': 'Ai', 'ओ': 'O', 'औ': 'Au'
  }

  const matras = {
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
    'ं': 'n', 'ँ': 'n', '्': ''
  }

  let result = ''
  let i = 0

  while (i < str.length) {
    const char = str[i]
    const nextChar = str[i + 1]

    if (vowels[char]) {
      result += vowels[char]
      i++
    } else if (consonants[char]) {
      let cEng = consonants[char]
      if (nextChar && matras[nextChar] !== undefined) {
        result += cEng + matras[nextChar]
        i += 2
      } else {
        const isEnd = i === str.length - 1 || str[i + 1] === ' '
        result += cEng + (isEnd ? '' : 'a')
        i++
      }
    } else if (matras[char]) {
      result += matras[char]
      i++
    } else {
      result += char
      i++
    }
  }

  return result
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
}

// 2. English to Devanagari Converter
function englishToDevanagariWord(rawWord) {
  if (!rawWord) return ''
  
  // Extract trailing punctuation like comma, period
  const match = rawWord.match(/^([a-zA-Z0-9_\u0900-\u097F]+)([^a-zA-Z0-9_\u0900-\u097F]*)$/)
  const word = match ? match[1] : rawWord
  const punct = match ? match[2] : ''

  const lower = word.toLowerCase()
  if (wordDictionary[lower]) {
    return wordDictionary[lower] + punct
  }

  const clusters = [
    { en: 'sh', hi: 'श' },
    { en: 'kh', hi: 'ख' },
    { en: 'gh', hi: 'घ' },
    { en: 'ch', hi: 'च' },
    { en: 'jh', hi: 'झ' },
    { en: 'th', hi: 'थ' },
    { en: 'dh', hi: 'ध' },
    { en: 'ph', hi: 'फ' },
    { en: 'bh', hi: 'भ' },
    { en: 'ee', hi: 'ी' },
    { en: 'oo', hi: 'ू' },
    { en: 'ai', hi: 'ै' },
    { en: 'au', hi: 'ौ' },
    { en: 'aa', hi: 'ा' }
  ]

  const singleConsonants = {
    k: 'क', g: 'ग', c: 'क', j: 'ज', t: 'त', d: 'द',
    n: 'न', p: 'प', f: 'फ', b: 'ब', m: 'म', y: 'य',
    r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', h: 'ह', z: 'ज़'
  }

  const independentVowels = {
    a: 'अ', e: 'ए', i: 'इ', o: 'ओ', u: 'उ'
  }

  const matraMap = {
    a: 'ा', e: 'े', i: 'ि', o: 'ो', u: 'ु'
  }

  let res = ''
  let i = 0
  let isStartOfWord = true

  while (i < lower.length) {
    if (i < lower.length - 1) {
      const pair = lower.substr(i, 2)
      const found = clusters.find((c) => c.en === pair)
      if (found) {
        if (isStartOfWord && (pair === 'ee' || pair === 'oo' || pair === 'aa' || pair === 'ai' || pair === 'au')) {
          res += pair === 'aa' ? 'आ' : pair === 'ee' ? 'ई' : pair === 'oo' ? 'ऊ' : pair === 'ai' ? 'ऐ' : 'औ'
        } else {
          res += found.hi
        }
        i += 2
        isStartOfWord = false
        continue
      }
    }

    const ch = lower[i]

    if (independentVowels[ch]) {
      if (isStartOfWord) {
        res += independentVowels[ch]
      } else {
        if (ch === 'a') {
          if (i === lower.length - 1 && lower.length > 3) {
            res += 'ा'
          }
        } else {
          res += matraMap[ch] || ''
        }
      }
      isStartOfWord = false
      i++
      continue
    }

    if (singleConsonants[ch]) {
      res += singleConsonants[ch]
      isStartOfWord = false
      i++
      continue
    }

    res += ch
    i++
  }

  return res + punct
}

function englishToDevanagari(str) {
  return str
    .split(' ')
    .map((word) => englishToDevanagariWord(word))
    .join(' ')
}

export function translateProfileText(text, targetLang) {
  if (!text || typeof text !== 'string') return ''
  const trimmed = text.trim()
  if (!trimmed) return ''

  const patternVal = translateFarmPattern(trimmed, targetLang)
  if (patternVal) return patternVal

  const lower = trimmed.toLowerCase()

  if (wordDictionary[lower]) {
    const val = wordDictionary[lower]
    if (targetLang === 'en' && !/[\u0900-\u097F]/.test(val)) return val
    if (targetLang === 'hi' && /[\u0900-\u097F]/.test(val)) return val
  }

  const containsHindi = /[\u0900-\u097F]/.test(trimmed)

  if (targetLang === 'en' && containsHindi) {
    return devanagariToEnglish(trimmed)
  }

  if (targetLang === 'hi' && !containsHindi) {
    return englishToDevanagari(trimmed)
  }

  return text
}
