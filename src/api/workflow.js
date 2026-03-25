import client from './client'

export const getWorkflow = () => client.get('/workflow')
export const createTask = (data) => client.post('/workflow/tasks', data)
export const updateTask = (id, data) => client.put(`/workflow/tasks/${id}`, data)
export const deleteTask = (id) => client.delete(`/workflow/tasks/${id}`)
export const updateTicketStatus = (id, status) => client.patch(`/workflow/tickets/${id}/status`, { status })

// Checklist
export const addChecklistItem = (taskId, text) =>
  client.post(`/workflow/tasks/${taskId}/checklist`, { text })
export const updateChecklistItem = (taskId, itemId, data) =>
  client.put(`/workflow/tasks/${taskId}/checklist/${itemId}`, data)
export const deleteChecklistItem = (taskId, itemId) =>
  client.delete(`/workflow/tasks/${taskId}/checklist/${itemId}`)