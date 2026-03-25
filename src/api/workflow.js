import client from './client'

export const getWorkflow = () => client.get('/workflow')
export const createTask = (data) => client.post('/workflow/tasks', data)
export const updateTask = (id, data) => client.put(`/workflow/tasks/${id}`, data)
export const deleteTask = (id) => client.delete(`/workflow/tasks/${id}`)
export const updateTicketStatus = (id, status) => client.patch(`/workflow/tickets/${id}/status`, { status })