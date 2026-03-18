import client from './client'

export const getTickets = (params = {}) =>
  client.get('/tickets', { params }).then(r => r.data)

export const getTicket = (id) =>
  client.get(`/tickets/${id}`).then(r => r.data)

export const createTicket = (data) => {
  const isFormData = data instanceof FormData
  return client.post('/tickets', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }).then(r => r.data)
}

export const updateTicket = (id, data) =>
  client.put(`/tickets/${id}`, data).then(r => r.data)

export const deleteTicket = (id) =>
  client.delete(`/tickets/${id}`).then(r => r.data)

export const tagSupervisor = (ticketId, supervisorId) =>
  client.post(`/tickets/${ticketId}/supervisors`, { supervisorId }).then(r => r.data)

export const untagSupervisor = (ticketId, supervisorId) =>
  client.delete(`/tickets/${ticketId}/supervisors/${supervisorId}`).then(r => r.data)

export const addComment = (ticketId, content, file) => {
  if (file) {
    const fd = new FormData()
    fd.append('content', content)
    fd.append('attachment', file)
    return client.post(`/tickets/${ticketId}/comments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  }
  return client.post(`/tickets/${ticketId}/comments`, { content }).then(r => r.data)
}

export const deleteComment = (ticketId, commentId) =>
  client.delete(`/tickets/${ticketId}/comments/${commentId}`).then(r => r.data)

export const getStats = () =>
  client.get('/stats').then(r => r.data)

export const getMonthlyStats = (from, to) =>
  client.get('/stats/monthly', { params: from && to ? { from, to } : {} }).then(r => r.data)
