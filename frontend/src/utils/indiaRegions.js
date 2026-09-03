// List of Indian States and Major Districts with Hindi/English translations

export const INDIAN_STATES = [
  { en: 'Punjab', hi: 'पंजाब' },
  { en: 'Haryana', hi: 'हरियाणा' },
  { en: 'Rajasthan', hi: 'राजस्थान' },
  { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश' },
  { en: 'Maharashtra', hi: 'महाराष्ट्र' },
  { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश' },
  { en: 'Gujarat', hi: 'गुजरात' },
  { en: 'Bihar', hi: 'बिहार' },
  { en: 'West Bengal', hi: 'पश्चिम बंगाल' },
  { en: 'Karnataka', hi: 'कर्नाटक' },
  { en: 'Tamil Nadu', hi: 'तमिलनाडु' },
  { en: 'Andhra Pradesh', hi: 'आंध्र प्रदेश' },
  { en: 'Telangana', hi: 'तेलंगाना' },
  { en: 'Odisha', hi: 'ओडिशा' },
  { en: 'Kerala', hi: 'केरल' },
  { en: 'Assam', hi: 'असम' },
  { en: 'Himachal Pradesh', hi: 'हिमाचल प्रदेश' },
  { en: 'Uttarakhand', hi: 'उत्तराखंड' },
  { en: 'Chhattisgarh', hi: 'छत्तीसगढ़' },
  { en: 'Jharkhand', hi: 'झारखंड' }
]

export const DISTRICTS_BY_STATE = {
  Punjab: [
    { en: 'Ludhiana', hi: 'लुधियाना' },
    { en: 'Amritsar', hi: 'अमृतसर' },
    { en: 'Jalandhar', hi: 'जालंधर' },
    { en: 'Patiala', hi: 'पटियाला' },
    { en: 'Bathinda', hi: 'बठिंडा' },
    { en: 'Hoshiarpur', hi: 'होशियारपुर' },
    { en: 'Moga', hi: 'मोगा' },
    { en: 'Pathankot', hi: 'पठानकोट' },
    { en: 'Sangrur', hi: 'संगरूर' },
    { en: 'Firozpur', hi: 'फिरोजपुर' }
  ],
  Haryana: [
    { en: 'Karnal', hi: 'करनाल' },
    { en: 'Hisar', hi: 'हिसार' },
    { en: 'Ambala', hi: 'अम्बाला' },
    { en: 'Rohtak', hi: 'रोहतक' },
    { en: 'Panipat', hi: 'पानीपत' },
    { en: 'Sirsa', hi: 'सिरसा' },
    { en: 'Sonipat', hi: 'सोनीपत' },
    { en: 'Kurukshetra', hi: 'कुरुक्षेत्र' }
  ],
  Rajasthan: [
    { en: 'Jaipur', hi: 'जयपुर' },
    { en: 'Jodhpur', hi: 'जोधपुर' },
    { en: 'Kota', hi: 'कोटा' },
    { en: 'Udaipur', hi: 'उदयपुर' },
    { en: 'Bikaner', hi: 'बीकानेर' },
    { en: 'Ajmer', hi: 'अजमेर' },
    { en: 'Alwar', hi: 'अलवर' },
    { en: 'Ganganagar', hi: 'गंगानगर' }
  ],
  'Uttar Pradesh': [
    { en: 'Lucknow', hi: 'लखनऊ' },
    { en: 'Kanpur', hi: 'कानपुर' },
    { en: 'Varanasi', hi: 'वाराणसी' },
    { en: 'Agra', hi: 'आगरा' },
    { en: 'Meerut', hi: 'मेरठ' },
    { en: 'Prayagraj', hi: 'प्रयागराज' },
    { en: 'Bareilly', hi: 'बरेली' },
    { en: 'Aligarh', hi: 'अलीगढ़' }
  ],
  Maharashtra: [
    { en: 'Pune', hi: 'पुणे' },
    { en: 'Nagpur', hi: 'नागपुर' },
    { en: 'Nashik', hi: 'नाशिक' },
    { en: 'Aurangabad', hi: 'औरंगाबाद' },
    { en: 'Satara', hi: 'सतारा' },
    { en: 'Kolhapur', hi: 'कोल्हापुर' }
  ]
}

/**
 * Fetch Pincode Details using India Post Postal Pincode API
 * API Endpoint: https://api.postalpincode.in/pincode/{PINCODE}
 */
export async function fetchPincodeDetails(pincode) {
  if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
    return null
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    const data = await res.json()

    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0]
      return {
        district: po.District,
        state: po.State,
        pincode: pincode,
        area: po.Name
      }
    }
    return null
  } catch (err) {
    console.error('Error fetching pincode details:', err)
    return null
  }
}

