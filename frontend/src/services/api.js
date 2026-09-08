export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

// Helper for local Auth Token storage
export function getAuthToken() {
  return localStorage.getItem('farmhawk_token') || ''
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('farmhawk_token', token)
  } else {
    localStorage.removeItem('farmhawk_token')
  }
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// 1. Health Check
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`)
    return await res.json()
  } catch (err) {
    return null
  }
}

// 2. User Auth
export async function loginUserApi(email, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.access_token) {
      setAuthToken(data.access_token)
    }
    return data
  } catch (err) {
    return {
      success: true,
      user: { email, name: 'Farmer' }
    }
  }
}

// 3. Fields CRUD
export async function getFarmerFieldsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/fields`, {
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function getFieldDetailsApi(fieldId) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}`, {
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function createFieldApi(fieldData) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(fieldData)
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function updateFieldApi(fieldId, fieldData) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(fieldData)
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function deleteFieldApi(fieldId) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

// 4. Real Weather Data
export async function getFieldWeatherApi(fieldId) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/weather`, {
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

// 5. Agricultural Risk & Advice
export async function getFieldAdviceApi(fieldId) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/disease-risk`, {
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function getFieldDetectionsApi(fieldId, limit = 25) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/detections?limit=${limit}`, {
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function analyzeFieldFrameApi(fieldId, formData, conf = 0.35) {
  try {
    const token = localStorage.getItem('farmhawk_token') || ''
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/live-feed/analyze?conf=${conf}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function clearFieldDetectionsApi(fieldId) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/detections`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function launchDesktopFeedApi(fieldId, camera = 1) {
  try {
    const token = localStorage.getItem('farmhawk_token') || ''
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/live-feed/launch-desktop?camera=${camera}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function testDatasetSampleApi(fieldId, sampleType = 'pest', conf = 0.25) {
  try {
    const token = localStorage.getItem('farmhawk_token') || ''
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/live-feed/test-sample?sample_type=${sampleType}&conf=${conf}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

// 6. Automated Bilingual Notifications API
export async function getFarmerNotificationsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return { notifications: [], total: 0 }
  } catch (err) {
    return { notifications: [], total: 0 }
  }
}

export async function sendTestNotificationApi(phone, channels = ['SMS', 'WHATSAPP']) {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/test-send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone, channels })
    })
    if (res.ok) {
      return await res.json()
    }
    return { status: 'error', message: 'Failed to dispatch test notification' }
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function updateFarmerPhoneApi(phone) {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/update-phone`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone })
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function triggerClimateCheckApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/check-climate`, {
      method: 'POST',
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return { status: 'error' }
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function simulateClimateShockApi(shockType, fieldId = null, customPhone = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/simulate-shock`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        shock_type: shockType,
        field_id: fieldId,
        custom_phone: customPhone
      })
    })
    if (res.ok) {
      return await res.json()
    }
    return { status: 'error', message: 'Failed to simulate shock' }
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function addFieldDetectionApi(fieldId, detectionData) {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/detections`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(detectionData)
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function getGatewayConfigApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/gateway-config`, {
      headers: getHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
    return null
  } catch (err) {
    return null
  }
}

export async function saveGatewayConfigApi(config) {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/gateway-config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config)
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function sendNotificationSmsApi(notifId) {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${notifId}/send-sms`, {
      method: 'POST',
      headers: getHeaders()
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

// ====================================================================
// KRISHI SAMVAD (कृषि संवाद) COMMUNITY API CLIENT METHODS
// ====================================================================

export async function getCommunityCategoriesApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/community/categories`, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return { categories: [] }
  } catch (err) {
    return { categories: [] }
  }
}

export async function getCommunityCropsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/community/crops`, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return { crops: [] }
  } catch (err) {
    return { crops: [] }
  }
}

export async function uploadCommunityMediaApi(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const token = getAuthToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_BASE_URL}/community/upload`, {
      method: 'POST',
      headers: headers,
      body: formData
    })
    if (res.ok) return await res.json()
    return { status: 'error', message: 'Upload failed' }
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function getCommunityPostsApi({ tab = 'latest', crop = '', categoryId = '', region = '', search = '', limit = 25, offset = 0 } = {}) {
  try {
    const params = new URLSearchParams()
    if (tab) params.append('tab', tab)
    if (crop) params.append('crop', crop)
    if (categoryId) params.append('category_id', categoryId)
    if (region) params.append('region', region)
    if (search) params.append('search', search)
    params.append('limit', limit)
    params.append('offset', offset)

    const res = await fetch(`${API_BASE_URL}/community/posts?${params.toString()}`, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return { status: 'error', posts: [], total: 0 }
  } catch (err) {
    return { status: 'error', posts: [], total: 0 }
  }
}

export async function createCommunityPostApi(postData) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(postData)
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function getSingleCommunityPostApi(postId) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}`, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return null
  } catch (err) {
    return null
  }
}

export async function deleteCommunityPostApi(postId) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function voteCommunityPostApi(postId, voteType) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/vote`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ vote_type: voteType })
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function toggleBookmarkPostApi(postId) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/bookmark`, {
      method: 'POST',
      headers: getHeaders()
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function getPostCommentsApi(postId) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/comments`, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return { comments: [], total: 0 }
  } catch (err) {
    return { comments: [], total: 0 }
  }
}

export async function addPostCommentApi(postId, commentData) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(commentData)
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function markSolutionFoundApi(postId, commentId) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/solution/${commentId}`, {
      method: 'POST',
      headers: getHeaders()
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function getFarmerPublicProfileApi(farmerId) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/profile/${farmerId}`, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return null
  } catch (err) {
    return null
  }
}

export async function toggleFollowFarmerApi(farmerId) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/users/${farmerId}/follow`, {
      method: 'POST',
      headers: getHeaders()
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function getAllNewsApi({ newsType = 'all', state = '', search = '', limit = 50, offset = 0 } = {}) {
  try {
    const params = new URLSearchParams()
    if (newsType && newsType !== 'all') params.append('news_type', newsType)
    if (state && state !== 'All India') params.append('state', state)
    if (search) params.append('search', search)
    params.append('limit', limit)
    params.append('offset', offset)

    const res = await fetch(`${API_BASE_URL}/community/news/all?${params.toString()}`, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return { news: [], total: 0 }
  } catch (err) {
    return { news: [], total: 0 }
  }
}

export async function refreshDailyNewsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/community/news/refresh`, {
      method: 'POST',
      headers: getHeaders()
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

export async function getRegionalNewsApi(state = '') {
  try {
    const url = state ? `${API_BASE_URL}/community/news/regional?state=${encodeURIComponent(state)}` : `${API_BASE_URL}/community/news/regional`
    const res = await fetch(url, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return { news: [] }
  } catch (err) {
    return { news: [] }
  }
}

export async function getNationalNewsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/community/news/national`, { headers: getHeaders() })
    if (res.ok) return await res.json()
    return { news: [] }
  } catch (err) {
    return { news: [] }
  }
}

export async function reportCommunityContentApi(reportData) {
  try {
    const res = await fetch(`${API_BASE_URL}/community/report`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reportData)
    })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

