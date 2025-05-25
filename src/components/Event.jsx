import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { format, parse } from 'date-fns';
import Modal from 'react-modal';
import { BASE_URL } from "./Globals";
import GroupIcon from '../photos/Group.svg';
import MinusIcon from '../photos/minus.svg';
import FolderIcon from '../photos/folder.svg';
import FileIcon from '../photos/file.svg';

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-[#0D062D]';

const formatUserName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length < 2) return fullName;
    
    const lastName = parts[0];
    const initials = parts.slice(1).map(name => name.charAt(0) + '.').join(' ');
    return `${lastName} ${initials}`;
};

const taskModalStyle = {
    content: {
        top: '273.5px',
        left: '496px',
        right: 'auto',
        bottom: 'auto',
        width: '448px',
        height: '353px',
        borderRadius: '24px',
        padding: '24px',
        gap: '12px',
        backgroundColor: '#FFFFFF',
        border: 'none',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
    },
};

const filesModalStyle = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#5C6373',
        width: '610px',
        height: '347px',
        borderRadius: '24px',
        border: '2px solid #FFFFFF',
        padding: '24px 32px',
    },
};

const formateDate = (date) => {
    if (date !== undefined) {
        date = parse(date, 'yyyy-MM-dd', new Date());
        const curMonth = date.toLocaleString('ru', {month: "long"});
        const formatedDate = `${format(date, 'dd')} ${curMonth.slice(0, curMonth.length-1)}я ${format(date, 'yyyy')}`;
        return formatedDate
    }
    return ''
};

const Event = () => {
    const location = useLocation();
    const eventData = Object.fromEntries(new URLSearchParams(location.search));
    const navigate = useNavigate();

    const [titleError, setTitleError] = useState(false);
    const [event, setEvent] = useState([]);
    const [users, setUsers] = useState([]);
    const [project, setProject] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isFolderOpen, setIsFolderOpen] = useState(false);
    const [filesModalIsOpen, setFilesModalIsOpen] = useState(false);
    const [taskModalIsOpen, setTaskModalIsOpen] = useState(false);
    const [editTaskModalIsOpen, setEditTaskModalIsOpen] = useState(false);
    const [createFolderModalIsOpen, setCreateFolderModalIsOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        deadline: '',
        deadlineTime: '',
        status: 2,
        assignee: '',
        subtasks: []
    });
    const [subtaskInput, setSubtaskInput] = useState('');

    useEffect(() => {
        // Проверяем наличие ID события
        if (!eventData.id) {
            console.error('ID события не найден');
            navigate('/events'); // Перенаправляем на список событий
            return;
        }

        if(localStorage.getItem('access_token') === null){                   
            window.location.href = '/'
            return;
        }

        (async () => {
            try {
                const data = await axios.get(`${BASE_URL}/api/event/${eventData.id}/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                console.log('Получены данные события:', data.data);
                
                // Проверяем наличие задач
                if (data.data.tasks) {
                    console.log('Исходные задачи:', data.data.tasks);
                }
                
                // Обрабатываем задачи, парсим JSON из строки task
                const processedData = {
                    ...data.data,
                    tasks: data.data.tasks?.map(task => {
                        try {
                            console.log('Обработка задачи:', task);
                            const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                            console.log('Распарсенные детали задачи:', taskDetails);
                            
                            return {
                                id: task.id,
                                title: taskDetails?.title || 'Без названия',
                                description: taskDetails?.description || '',
                                deadline: taskDetails?.deadline || null,
                                status: taskDetails?.status || 2,
                                user: taskDetails?.user || null,
                                assignee: taskDetails?.user || null,
                                subtasks: taskDetails?.subtasks || [],
                                task: task.task // сохраняем оригинальную строку JSON
                            };
                        } catch (error) {
                            console.error('Ошибка при обработке задачи:', error);
                            return {
                                id: task.id,
                                title: 'Без названия',
                                description: '',
                                deadline: null,
                                status: 2,
                                user: null,
                                assignee: null,
                                subtasks: [],
                                task: task.task
                            };
                        }
                    }) || []
                };
                
                console.log('Обработанные данные:', processedData);
                setEvent(processedData);

                const usersData = await axios.get(`${BASE_URL}/api/users/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setUsers(usersData.data);

                const proj = await axios.get(`${BASE_URL}/projects/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setProject(proj.data);
            } catch(e) {
                console.log(e);
            }
        })();
    }, [eventData.id, navigate]);

    let orgs = {};
    for (const user of users) {
        orgs[user.id] = user.full_name;
    }

    let projects = {};
    for (const pro of project) {
        projects[pro.id] = pro;
    }

    const updateEvent = (updatedEvent) => {
        console.log('Начало обновления события');
        console.log('ID события из URL:', eventData.id);
        console.log('Обновляемое событие:', updatedEvent);
        
        if (!updatedEvent) {
            console.error('Отсутствуют данные для обновления события');
            return;
        }

        // Подготавливаем данные для отправки
        const eventDataToUpdate = {
            title: updatedEvent.title || "",
            description: updatedEvent.description || "",
            date: updatedEvent.date || format(new Date(), 'yyyy-MM-dd'),
            organizers: Array.isArray(updatedEvent.organizers) ? updatedEvent.organizers : [],
            is_past: updatedEvent.is_past !== undefined ? updatedEvent.is_past : false,
            participants: Array.isArray(updatedEvent.participants) ? updatedEvent.participants : [],
            projects: Array.isArray(updatedEvent.projects) ? updatedEvent.projects : []
        };

        // Если есть задачи, добавляем их в данные события
        if (Array.isArray(updatedEvent.tasks) && updatedEvent.tasks.length > 0) {
            eventDataToUpdate.tasks = updatedEvent.tasks.map(task => {
                // Если это существующая задача с task строкой
                if (task.task && typeof task.task === 'string') {
                    try {
                        // Проверяем, что это валидный JSON
                        JSON.parse(task.task);
                        return task.task;
                    } catch (e) {
                        console.log('Ошибка парсинга JSON существующей задачи');
                    }
                }

                // Если это новая задача или задача требует преобразования
                return JSON.stringify({
                    title: task.title || "",
                    description: task.description || "",
                    deadline: task.deadline || null,
                    status: task.status || 2,
                    user: task.user || null,
                    event: parseInt(eventData.id),
                    subtasks: Array.isArray(task.subtasks) ? task.subtasks : []
                });
            });
        } else {
            eventDataToUpdate.tasks = [];
        }

        console.log('Подготовленные данные события:', eventDataToUpdate);

        // Используем ID из URL параметров
        const eventId = Object.fromEntries(new URLSearchParams(location.search)).id;

        if (!eventId) {
            console.error('ID события не найден');
            alert('Ошибка: ID события не найден');
            return;
        }

        axios.put(`${BASE_URL}/api/event/${eventId}/`, eventDataToUpdate, {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
            }
        })
        .then(response => {
            console.log('Успешный ответ от сервера:', response.data);
            
            // Обновляем состояние с данными от сервера
            const processedData = {
                ...response.data,
                tasks: response.data.tasks?.map(task => {
                    try {
                        const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                        return {
                            id: task.id,
                            title: taskDetails.title,
                            description: taskDetails.description,
                            deadline: taskDetails.deadline,
                            status: taskDetails.status,
                            user: taskDetails.user,
                            assignee: taskDetails.user,
                            subtasks: taskDetails.subtasks || [],
                            task: typeof task.task === 'string' ? task.task : JSON.stringify(taskDetails)
                        };
                    } catch (error) {
                        console.error('Ошибка при обработке задачи:', error);
                        return task;
                    }
                }) || []
            };
            
            setEvent(processedData);
            setIsEditing(false);
        }) 
        .catch(error => { 
            console.error('Ошибка при обновлении события:', error);
            console.error('Детали ошибки:', error.response?.data);
            console.error('Статус ошибки:', error.response?.status);
            console.error('Отправленные данные:', eventDataToUpdate);
            alert('Не удалось обновить событие. Пожалуйста, проверьте данные и попробуйте снова.');
        });
    };

    const updateOrganizers = (selectedUserIds) => {
        const updatedEvent = {
            ...event,
            organizers: selectedUserIds
        };
        
        // Используем общую функцию обновления события
        updateEvent(updatedEvent);
    };

    const handleDelete = (evt) => {
        axios.delete(`${BASE_URL}/api/event/${eventData.id}/`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
        .then(response => {
            window.location.href = '/events'
        })
        .catch(error => {
            console.log(error);
        });
    }

    const handleChangeStatus = (newStatus) => {
        const updatedEvent = {
            ...event,
            is_past: newStatus,
            date: newStatus === false ? format(new Date(), 'yyyy-MM-dd') : event.date
        };
        
        // Используем общую функцию обновления события
        updateEvent(updatedEvent);
    };

    function closeModal() {
        setFilesModalIsOpen(false);
    }

    const handleCreateFile = (type, title, custom_name) => {
        const projectId = event.projects?.length > 0 ? event.projects[0] : null;
        
        if (!projectId) {
            alert('Нет доступных проектов для создания документа');
            return;
        }
    
        const data = { 
            doc_type: type, 
            title: title, 
            custom_name: custom_name
        };
        
        axios.post(`${BASE_URL}/projects/${projectId}/create_google_service/`, data, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        })
        .then(response => {
            const message = document.getElementById('succes_file');
            message.classList.remove('hidden');
            setFilesModalIsOpen(false);
            setTimeout(() => {
                message.classList.add('hidden');
            }, 3000);
        })
        .catch(error => { 
            console.error('Error creating Google service:', error);
            const message = document.getElementById('error_file');
            message.classList.remove('hidden');
            setTimeout(() => {
                message.classList.add('hidden');
            }, 3000);
        });
    };

    function createFolder() {
        if (!newFolderName.trim()) {
            alert('Пожалуйста, введите название папки');
            return;
        }

        const data = { 
            title: newFolderName.trim(),
            event_id: eventData.id
        };

        axios.post(`${BASE_URL}/projects/create/`, data, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log('Ответ сервера при создании папки:', response.data);
            
            // Обновляем список проектов в событии
            setEvent(prevEvent => ({
                ...prevEvent,
                projects: [...(prevEvent.projects || []), response.data.id]
            }));

            // Загружаем обновленный список проектов
            axios.get(`${BASE_URL}/projects/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            })
            .then(projResponse => {
                setProject(projResponse.data);
            })
            .catch(error => {
                console.error('Ошибка при загрузке проектов:', error);
            });
            
            setNewFolderName('');
            setCreateFolderModalIsOpen(false);
            
            const message = document.getElementById('succes_folder');
            message.classList.remove('hidden');
            setTimeout(() => {
                message.classList.add('hidden');
            }, 3000);
        })
        .catch(error => { 
            console.error('Ошибка при создании папки:', error);
            console.error('Детали ошибки:', error.response?.data);
            const message = document.getElementById('error_folder');
            message.classList.remove('hidden');
            setTimeout(() => {
                message.classList.add('hidden');
            }, 3000);
        });
    }

    const handleAddSubtask = () => {
        if (subtaskInput.trim()) {
            setNewTask({
                ...newTask,
                subtasks: [...newTask.subtasks, {
                    title: subtaskInput.trim(),
                    status: 2
                }]
            });
            setSubtaskInput('');
        }
    };

    const handleRemoveSubtask = (index) => {
        setNewTask({
            ...newTask,
            subtasks: newTask.subtasks.filter((_, i) => i !== index)
        });
    };

    const handleCreateTask = () => {
        if (!newTask.title || newTask.title.trim() === '') {
            console.log('Попытка создания задачи без названия');
            setTitleError(true);
            return;
        }
        console.log('Начало создания задачи:', newTask);
        
        // Оптимизируем структуру данных для уменьшения размера JSON
        const deadlineString = newTask.deadline ? (newTask.deadline + (newTask.deadlineTime ? 'T' + newTask.deadlineTime : '')) : null;
        const taskObject = {
            t: newTask.title.trim(),
            d: newTask.description?.trim() || '',
            dl: deadlineString,
            s: newTask.status || 2,
            e: newTask.assignee || null,
            ev: parseInt(eventData.id),
            st: newTask.subtasks.map(subtask => ({
                t: (subtask.title || '').trim(),
                s: subtask.status || 2
            }))
        };

        const taskJson = JSON.stringify(taskObject);
        
        const taskData = {
            task: taskJson,
            event: eventData.id,
            executor: newTask.assignee || null
        };

        console.log('Подготовленные данные задачи:', taskData);

        axios.post(`${BASE_URL}/api/tasks/`, taskData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
        .then(response => {
            console.log('Успешный ответ от сервера:', response.data);
            
            // Преобразуем обратно в полные имена полей для отображения
            const taskDetails = JSON.parse(response.data.task);
            const fullTaskDetails = {
                title: taskDetails.t || taskDetails.title || '',
                description: taskDetails.d || taskDetails.description || '',
                deadline: taskDetails.dl || taskDetails.deadline || null,
                status: taskDetails.s || taskDetails.status || 2,
                executor: taskDetails.e || taskDetails.executor || null,
                event: taskDetails.ev || taskDetails.event || parseInt(eventData.id),
                subtasks: (taskDetails.st || taskDetails.subtasks || []).map(st => ({
                    title: st.t || st.title || '',
                    status: st.s || st.status || 2
                }))
            };
            
            // Обновляем список задач в событии
            const updatedEvent = {
                ...event,
                tasks: [...(event.tasks || []), {
                    id: response.data.id,
                    ...fullTaskDetails,
                    task: response.data.task
                }]
            };
            
            console.log('Обновленное событие:', updatedEvent);
            setEvent(updatedEvent);
            
            // Сбрасываем форму
            setNewTask({
                title: '',
                description: '',
                deadline: '',
                deadlineTime: '',
                status: 2,
                assignee: '',
                subtasks: []
            });
            setTaskModalIsOpen(false);
            setTitleError(false);
        })
        .catch(error => {
            console.error('Ошибка при создании задачи:', error);
            console.error('Детали ошибки:', error.response?.data);
            console.error('Статус ошибки:', error.response?.status);
            alert('Не удалось создать задачу. Пожалуйста, проверьте данные и попробуйте снова.');
        });
    };

    const handleEditTask = (task) => {
        if (!task) return;
        try {
            let taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
            if (taskDetails.t !== undefined) {
                taskDetails = {
                    title: taskDetails.t || '',
                    description: taskDetails.d || '',
                    deadline: taskDetails.dl || '',
                    status: taskDetails.s || 2,
                    executor: taskDetails.e || '',
                    event: taskDetails.ev || '',
                    subtasks: (taskDetails.st || []).map(st => ({
                        title: st.t || '',
                        status: st.s || 2
                    }))
                };
            }
            // Разбиваем дедлайн на дату и время
            let deadline = '';
            let deadlineTime = '';
            if (taskDetails.deadline && taskDetails.deadline.includes('T')) {
                [deadline, deadlineTime] = taskDetails.deadline.split('T');
            } else {
                deadline = taskDetails.deadline || '';
                deadlineTime = '';
            }
            const executorId = task.executor || taskDetails.executor || taskDetails.user || '';
            setSelectedTask(task);
            setNewTask({
                title: taskDetails?.title || '',
                description: taskDetails?.description || '',
                deadline,
                deadlineTime,
                status: taskDetails?.status || 2,
                assignee: executorId.toString(),
                subtasks: taskDetails?.subtasks || []
            });
            setEditTaskModalIsOpen(true);
        } catch (error) {
            setSelectedTask(task);
            setNewTask({
                title: '',
                description: '',
                deadline: '',
                deadlineTime: '',
                status: 2,
                assignee: '',
                subtasks: []
            });
            setEditTaskModalIsOpen(true);
        }
    };

    const handleUpdateTask = () => {
        if (!selectedTask) return;
        
        try {
            const taskDetails = typeof selectedTask.task === 'string' ? JSON.parse(selectedTask.task) : selectedTask;
            
            // Оптимизируем структуру данных для уменьшения размера JSON
            const deadlineString = newTask.deadline ? (newTask.deadline + (newTask.deadlineTime ? 'T' + newTask.deadlineTime : '')) : null;
            const taskObject = {
                t: newTask.title.trim(),
                d: newTask.description?.trim() || '',
                dl: deadlineString,
                s: newTask.status || 2,
                e: newTask.assignee || null,
                ev: parseInt(eventData.id),
                st: newTask.subtasks.map(subtask => ({
                    t: (subtask.title || '').trim(),
                    s: subtask.status || 2
                }))
            };

            const taskJson = JSON.stringify(taskObject);
            
            const taskData = {
                task: taskJson,
                event: parseInt(eventData.id),
                executor: newTask.assignee || null
            };

            console.log('Отправляемые данные:', taskData);

            axios.put(`${BASE_URL}/api/tasks/${selectedTask.id}/`, taskData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                console.log('Ответ сервера:', response.data);
                
                // Преобразуем обратно в полные имена полей для отображения
                const updatedTaskDetails = JSON.parse(response.data.task);
                const fullTaskDetails = {
                    title: updatedTaskDetails.t || updatedTaskDetails.title || '',
                    description: updatedTaskDetails.d || updatedTaskDetails.description || '',
                    deadline: updatedTaskDetails.dl || updatedTaskDetails.deadline || null,
                    status: updatedTaskDetails.s || updatedTaskDetails.status || 2,
                    executor: updatedTaskDetails.e || updatedTaskDetails.executor || null,
                    event: updatedTaskDetails.ev || updatedTaskDetails.event || parseInt(eventData.id),
                    subtasks: (updatedTaskDetails.st || updatedTaskDetails.subtasks || []).map(st => ({
                        title: st.t || st.title || '',
                        status: st.s || st.status || 2
                    }))
                };

                const updatedTask = {
                    id: response.data.id,
                    ...fullTaskDetails,
                    task: response.data.task
                };

                setEvent(prevEvent => ({
                    ...prevEvent,
                    tasks: prevEvent.tasks.map(t => 
                        t.id === selectedTask.id ? updatedTask : t
                    )
                }));
                setEditTaskModalIsOpen(false);
            })
            .catch(error => {
                console.error('Ошибка при обновлении задачи:', error);
                console.error('Детали ошибки:', error.response?.data);
                alert('Не удалось обновить задачу. Пожалуйста, проверьте данные и попробуйте снова.');
            });
        } catch (error) {
            console.error('Ошибка при обработке задачи:', error);
            alert('Не удалось обновить задачу. Пожалуйста, попробуйте снова.');
        }
    };

    const handleUpdateSubtaskStatus = (task, taskDetails, subtaskIndex, newStatus) => {
        try {
            const updatedSubtasks = [...(taskDetails.subtasks || [])];
            const subtask = updatedSubtasks[subtaskIndex];
            
            if (typeof subtask === 'string') {
                updatedSubtasks[subtaskIndex] = {
                    title: subtask,
                    status: newStatus
                };
            } else {
                updatedSubtasks[subtaskIndex] = {
                    ...subtask,
                    status: newStatus
                };
            }

            // Формируем сокращённый объект задачи
            const taskObject = {
                t: taskDetails.title || taskDetails.t || '',
                d: taskDetails.description || taskDetails.d || '',
                dl: taskDetails.deadline || taskDetails.dl || null,
                s: taskDetails.status || taskDetails.s || 2,
                e: taskDetails.executor || taskDetails.e || null,
                ev: taskDetails.event || taskDetails.ev || null,
                st: updatedSubtasks.map(st => ({
                    t: st.title || st.t || '',
                    s: st.status || st.s || 2
                }))
            };

            const taskData = {
                task: JSON.stringify(taskObject),
                event: taskDetails.event || taskDetails.ev || '',
                executor: taskDetails.executor || taskDetails.e || null
            };

            axios.put(`${BASE_URL}/api/tasks/${task.id}/`, taskData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                const updatedTaskDetails = JSON.parse(response.data.task);
                const fullTaskDetails = {
                    title: updatedTaskDetails.t || updatedTaskDetails.title || '',
                    description: updatedTaskDetails.d || updatedTaskDetails.description || '',
                    deadline: updatedTaskDetails.dl || updatedTaskDetails.deadline || null,
                    status: updatedTaskDetails.s || updatedTaskDetails.status || 2,
                    executor: updatedTaskDetails.e || updatedTaskDetails.executor || null,
                    event: updatedTaskDetails.ev || updatedTaskDetails.event || null,
                    subtasks: (updatedTaskDetails.st || updatedTaskDetails.subtasks || []).map(st => ({
                        title: st.t || st.title || '',
                        status: st.s || st.status || 2
                    }))
                };

                const updatedTask = {
                    id: response.data.id,
                    ...fullTaskDetails,
                    task: response.data.task
                };

                setEvent(prevEvent => ({
                    ...prevEvent,
                    tasks: prevEvent.tasks.map(t => 
                        t.id === task.id ? updatedTask : t
                    )
                }));
            })
            .catch(error => {
                console.error('Ошибка при обновлении статуса подзадачи:', error);
                alert('Не удалось обновить статус подзадачи. Пожалуйста, попробуйте снова.');
            });
        } catch (error) {
            console.error('Ошибка при обработке подзадачи:', error);
            alert('Не удалось обновить статус подзадачи. Пожалуйста, попробуйте снова.');
        }
    };

    const handleDeleteProject = (projectId) => {
        if (!projectId) {
            console.error('ID проекта не определен');
            alert('Ошибка: ID проекта не определен');
            return;
        }

        if (window.confirm('Вы уверены, что хотите удалить эту папку?')) {
            axios.delete(`${BASE_URL}/projects/${projectId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(() => {
                // Обновляем список проектов в состоянии события
                setEvent(prevEvent => ({
                    ...prevEvent,
                    projects: prevEvent.projects.filter(p => p !== projectId)
                }));
                
                // Удаляем проект из объекта projects
                setProject(prevProjects => prevProjects.filter(p => p.id !== projectId));
            })
            .catch(error => {
                console.error('Ошибка при удалении проекта:', error);
                console.error('Детали ошибки:', error.response?.data);
                alert('Не удалось удалить папку. Пожалуйста, попробуйте снова.');
            });
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
            try {
                await axios.delete(`${BASE_URL}/api/tasks/${taskId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                // Обновляем список задач в событии
                setEvent(prevEvent => ({
                    ...prevEvent,
                    tasks: prevEvent.tasks.filter(task => task.id !== taskId)
                }));
            } catch (error) {
                console.error('Ошибка при удалении задачи:', error);
                alert('Не удалось удалить задачу. Пожалуйста, попробуйте снова.');
            }
        }
    };

    return (
        <div className='mx-auto p-6 bg-[#ECF2FF] w-screen h-auto'>
            <div className="bg-[#FFFFFF] rounded-3xl p-6 h-auto overflow-y-auto overflow-x-hidden">
                <div className="flex items-center mb-[24px]">
                    <button 
                        onClick={() => navigate('/events')}
                        className="mr-4 text-[#0D062D] hover:text-[#0077EB] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className={`${textStyleSemibold} text-[40px] leading-[48px] mr-auto`}>Мероприятия</h1>
                    {event.is_past
                    ?<button className={`${buttonStyle} w-[200px] mr-[12px]`} onClick={(evt) => {evt.preventDefault(); handleChangeStatus(false)}}>Вернуть</button>
                    :<button className={`${buttonStyle} w-[200px] mr-[12px]`} onClick={(evt) => {evt.preventDefault(); handleChangeStatus(true)}}>Завершить</button>
                    }
                    <button className={`${buttonStyle} w-[200px] mr-[12px]`} onClick={(evt) => {handleDelete(evt)}}>Удалить</button>
                    <button className={`${buttonStyle} w-[200px]`} onClick={
                        (evt) => {
                            evt.preventDefault();
                            if (isEditing) {
                                updateEvent(event);
                            }
                            setIsEditing(!isEditing);
                        }
                    }>{isEditing ? 'Подтвердить' : 'Редактировать'}</button>
                </div>
                <div className="flex justify-between gap-10 h-[calc(100vh-180px)]">
                    {/* Левая колонка с информацией о мероприятии */}
                    <div className="w-[400px] flex-shrink-0 mr-8">
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Название</p>
                        {isEditing
                        ? <input className="mb-6 bg-[#F1F1F1] h-[40px] rounded pl-[10px] w-full" 
                            type="text" value={`${event.title}`} 
                            onChange={(e) => {setEvent({...event, title: e.target.value })}}/>
                        : <p className="font-gilroy_heavy text-[48px] text-[#0D062D] leading-[61px] mb-[12px]">{event.title}</p>
                        }
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Дата</p>
                        {isEditing
                        ? <input className="mb-6 bg-[#F1F1F1] h-[40px] rounded pl-[10px] w-full" 
                            type='date' 
                            onChange={(e) => {setEvent({...event, date: e.target.value })}}/>
                        : <p className="font-gilroy_bold text-[24px] text-[#0D062D] leading-[30px] mb-[12px]">{formateDate(event.date)}</p>
                        }
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Описание</p>
                        {isEditing
                        ? <input className="mb-6 bg-[#F1F1F1] h-[40px] rounded pl-[10px] w-full" 
                            type="textarea" value={`${event.description}`} 
                            onChange={(e) => {setEvent({...event, description: e.target.value })}}/>
                        : <p className="font-gilroy_bold text-[24px] text-[#0D062D] leading-[30px] mb-[12px] line-clamp-3 overflow-hidden max-w-[395px]" style={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', wordBreak: 'break-word'}}>{event.description}</p>
                        }
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Организаторы</p>
                        {isEditing
                        ?
                        <div>
                            {event.organizers?.map((org) => {
                                return <p key={`organizer-${org}`} className="text-[#0D062D] font-gilroy_semibold text-[22px] leading-[27px] mb-3">{orgs[org]}</p>
                            })}
                            <select 
                                multiple
                                value={event.organizers || []}
                                className="bg-[#F1F1F1] rounded pl-[10px]"
                                onChange={(e) => {
                                    const options = e.target.options;
                                    const selectedIds = [];
                                    for (let i = 0; i < options.length; i++) {
                                    if (options[i].selected) {
                                        selectedIds.push(options[i].value);
                                    }
                                    }
                                    updateOrganizers(selectedIds);
                                }}
                                >
                                {users?.map((user) => (
                                    <option key={`user-option-${user.id}`} value={user.id}>
                                    {user.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        :
                        event.organizers?.map((org) => {
                            return <p key={`organizer-display-${org}`} className="text-[#0D062D] font-gilroy_semibold text-[22px] leading-[27px] mb-3">{orgs[org]}</p>
                        })
                        }
                        <div className="flex items-center gap-2 mb-4">
                            <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Папки</p>
                            <button 
                                onClick={() => setCreateFolderModalIsOpen(true)}
                                className="w-[32px] h-[32px] rounded-xl flex items-center justify-center"
                            >
                                <img src={GroupIcon} alt="Создать папку" className="w-5 h-5" />
                            </button>
                        </div>
                        {event.projects && event.projects.length > 0 && (
                            <div className="mt-4">
                                
                                <div className="grid grid-cols-3 gap-4">
                                    {event.projects.map(projectId => {
                                        const project = projects[projectId];
                                        if (!project) return null;
                                        return (
                                            <div className="flex items-center mb-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteProject(project.id);
                                                    }}
                                                    className="mr-2"
                                                >
                                                    <img src={MinusIcon} alt="Удалить" className="w-5 h-5" />
                                                </button>
                                                <div className="flex items-center bg-[#F4F4F4] hover:bg-[#E0E0E0] rounded-lg p-3 transition-colors">
                                                    <img src={FolderIcon} alt="Папка" className="w-5 h-5 mr-[10px]" />
                                                    <Link
                                                        to={`/folder?project_id=${project.id}&event_id=${event.id}`}
                                                        className="font-gilroy_semibold text-[#0D062D] text-sm"
                                                    >
                                                        {project.title}
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Центральная колонка с задачами */}
                    <div className="w-[395px] bg-[#F4F4F4] rounded-[15px] p-[10px] gap-[10px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-[#56B0FF] h-[11px] w-[11px] rounded-full flex-shrink-0"/>
                                <h3 className="font-gilroy_semibold text-[#0D062D] text-[27px]">Задачи</h3>
                            </div>
                            <button 
                                className="w-[32px] h-[32px] rounded-xl flex items-center justify-center"
                                onClick={() => {
                                    setNewTask({
                                        title: '',
                                        description: '',
                                        deadline: '',
                                        deadlineTime: '',
                                        status: 2,
                                        assignee: '',
                                        subtasks: []
                                    });
                                    setTaskModalIsOpen(true);
                                }}
                            >
                                <img src={GroupIcon} alt="Добавить" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3 max-h-[510px] overflow-y-auto">
                            {event.tasks?.map((task, index) => {
                                let taskDetails;
                                try {
                                    taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                                    // Проверяем наличие сокращенных имен полей
                                    if (taskDetails.t !== undefined) {
                                        taskDetails = {
                                            title: taskDetails.t || '',
                                            description: taskDetails.d || '',
                                            deadline: taskDetails.dl || null,
                                            status: taskDetails.s || 2,
                                            executor: taskDetails.e || null,
                                            event: taskDetails.ev || null,
                                            subtasks: (taskDetails.st || []).map(st => ({
                                                title: st.t || '',
                                                status: st.s || 2
                                            }))
                                        };
                                    }
                                } catch (error) {
                                    console.error('Ошибка при парсинге задачи:', error);
                                    taskDetails = task;
                                }
                                
                                return (
                                    <div 
                                        key={`task-${task.id}`}
                                        className="bg-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
                                    >
                                        <button
                                            key={`delete-${task.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTask(task.id);
                                            }}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <div className="flex flex-col">
                                            <div className="cursor-pointer group" onClick={() => handleEditTask(task)}>
                                                <h3 
                                                    className={`${textStyleSemibold} text-[20px] mb-2 group-hover:underline cursor-pointer`}
                                                >
                                                    {taskDetails?.title || taskDetails?.t || 'Без названия'}
                                                </h3>
                                            </div>
                                            {taskDetails?.subtasks && Array.isArray(taskDetails.subtasks) && taskDetails.subtasks.length > 0 && (
                                                <div className="mb-2">
                                                    <ul className="list-disc list-inside mt-1">
                                                        {taskDetails.subtasks.slice(0, 3).map((subtask, subIndex) => {
                                                            const subtaskTitle = typeof subtask === 'string' ? subtask : (subtask?.title || '');
                                                            const subtaskStatus = typeof subtask === 'string' ? 2 : (subtask?.status || 2);
                                                            return (
                                                                <li key={`subtask-${task.id}-${subIndex}`} className="flex items-center gap-2 mb-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-4 h-4 rounded border-[#0D062D]"
                                                                        checked={subtaskStatus === 3}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            const newStatus = e.target.checked ? 3 : 2;
                                                                            handleUpdateSubtaskStatus(
                                                                                task,
                                                                                taskDetails,
                                                                                subIndex,
                                                                                newStatus
                                                                            );
                                                                        }}
                                                                    />
                                                                    <span className="text-[#0D062D] text-sm">
                                                                        {subtaskTitle}
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                        {taskDetails.subtasks.length > 3 && (
                                                            <li className="flex items-left justify-left text-[#0D062D] text-opacity-50 text-lg">...</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-end justify-between mt-2 w-full">
                                                {/* Дедлайн слева */}
                                                {taskDetails?.deadline && (
                                                    <div className="bg-[#FFA500] text-white px-2 py-1 rounded text-[12px] w-[80px] h-[23px] flex items-center justify-center">
                                                        {new Date(taskDetails.deadline).toLocaleString('ru-RU', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: false
                                                        }).replace(',', '')}
                                                    </div>
                                                )}
                                                {/* Статус по центру */}
                                                <div className="flex items-center justify-center flex-1">
                                                    <span style={{
                                                        minWidth: taskDetails?.status === 1 ? 80 : taskDetails?.status === 2 ? 74 : 79,
                                                        height: 23,
                                                        borderRadius: 4,
                                                        padding: '4px 8px',
                                                        gap: 2,
                                                        background: taskDetails?.status === 1 ? '#FEF7DA' : taskDetails?.status === 2 ? '#FBE0D7' : '#DAF2D3',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            marginRight: 8,
                                                            background: taskDetails?.status === 1 ? '#FAE06D' : taskDetails?.status === 2 ? '#EE845F' : '#6DCD4E',
                                                            aspectRatio: '1/1',
                                                            flexShrink: 0
                                                        }}></span>
                                                        {taskDetails?.status === 1 ? 'в процессе' : taskDetails?.status === 2 ? 'не начата' : 'выполнена'}
                                                    </span>
                                                </div>
                                                {/* Исполнитель справа */}
                                                {taskDetails?.executor && (
                                                    <span className="bg-[#F4F4F4] px-2 py-1 rounded-xl font-gilroy_semibold text-[#0D062D] text-[15px] ml-2">
                                                        {formatUserName(orgs[taskDetails.executor])}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Правая колонка со статусом */}
                    <div className="flex flex-col gap-4">
                        <div className={`w-[186px] h-[54px] rounded-xl items-center p-3
                            ${event.is_past ? 'bg-[#DCF0DD] text-[#549D73]'  : 'bg-[#FFE3B0] text-[#FFA500]' }`}>
                            <p className={` text-center text-[28px] leading-[34px]`}>
                                {event.is_past ? 'Прошло' : 'В процессе' }
                            </p>
                        </div>
                    </div>
                </div>
                {isFolderOpen && (
                    <div className="mt-6">
                        <p className="font-gilroy_heavy text-[32px] text-[#0D062D] leading-[39px] mb-[12px]">Название папки</p>
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Файлы</p>
                        <button className={`${buttonStyle} w-[200px] h-fit mt-4`} onClick={() => {setFilesModalIsOpen(true)}}>
                            Создать Google файл
                        </button>
                    </div>
                )}
            </div>
            <div id='succes_file' className="hidden bg-[#1E632A80] w-[600px] h-[60px] rounded-[15px] border-[4px] border-[#1E632A] 
            text-center p-[15px] absolute top-3/4 left-1/2 -translate-x-1/2 z-50">
                <p className="text-[#0D062D] text-[24px] leading-[30px] font-gilroy_bold">Google сервис создан</p>
            </div>
            <div id='error_file' className="hidden bg-[#631E1E80] w-[600px] h-[60px] rounded-[15px] border-[4px] border-[#631E1E] 
            text-center p-[15px] absolute top-3/4 left-1/2 -translate-x-1/2 z-50">
                <p className="text-[#0D062D] text-[24px] leading-[30px] font-gilroy_bold">Google сервис не создан</p>
            </div>
            <div id='succes_folder' className="hidden bg-[#1E632A80] w-[600px] h-[60px] rounded-[15px] border-[4px] border-[#1E632A] 
            text-center p-[15px] absolute top-3/4 left-1/2 -translate-x-1/2 z-50">
                <p className="text-[#0D062D] text-[24px] leading-[30px] font-gilroy_bold">Папка создана</p>
            </div>
            <div id='error_folder' className="hidden bg-[#631E1E80] w-[600px] h-[60px] rounded-[15px] border-[4px] border-[#631E1E] 
            text-center p-[15px] absolute top-3/4 left-1/2 -translate-x-1/2 z-50">
                <p className="text-[#0D062D] text-[24px] leading-[30px] font-gilroy_bold">Папка не создана</p>
            </div>

            {/* Модальное окно создания задачи */}
            <Modal
                isOpen={taskModalIsOpen}
                onRequestClose={() => {
                    setTaskModalIsOpen(false)
                    setTitleError(false)
                }}
                style={{
                    ...taskModalStyle,
                    content: {
                    ...taskModalStyle.content,
                    height: 'auto',
                    maxHeight: '90vh',
                    overflow: 'hidden'
                    }
                }}
            >
                <div className="flex flex-col gap-4">
                    
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                          placeholder="Задача"
                            className={`bg-[#F1F4F9] rounded-lg p-2 ${titleError ? 'border border-red-500' : ''}`}
                            value={newTask.title}
                            onChange={(e) => { 
                            setNewTask({...newTask, title: e.target.value})
                            setTitleError(false)
                        }}
                        />
                        {titleError && (
                            <p className="text-red-500 text-sm mt-1">
                                Пожалуйста, введите название
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 flex-grow min-h-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="bg-[#F1F4F9] rounded-lg p-2 flex-1"
                                value={subtaskInput}
                                onChange={(e) => setSubtaskInput(e.target.value)}
                                placeholder="Подзадача"
                            />
                            <button
                                className=""
                                onClick={handleAddSubtask}
                            >
                            <img 
                                src={GroupIcon} 
                                alt="Иконка" 
                                className="" // Регулируйте размер
                            />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[100px]">
                            {newTask.subtasks.map((subtask, index) => (
                                <div key={index} className="flex items-center gap-2 bg-[#F1F4F9] rounded-lg p-2">
                                    <span className="flex-1">{typeof subtask === 'string' ? subtask : subtask.title}</span>
                                    <button
                                        className="text-red-500"
                                        onClick={() => handleRemoveSubtask(index)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col flex-1">
                            <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Дедлайн</label>
                            <input
                                type="date"
                                className="bg-[#F1F4F9] rounded-lg p-2 w-[112px] h-[34px]"
                                value={newTask.deadline || ''}
                                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Время</label>
                            <input
                                type="time"
                                className="bg-[#F1F4F9] rounded-lg p-2 w-[112px] h-[34px]"
                                value={newTask.deadlineTime || ''}
                                onChange={(e) => setNewTask({...newTask, deadlineTime: e.target.value})}
                            />
                        </div>
                        {taskModalIsOpen ? (
                            <input type="hidden" value="2" />
                        ) : (
                            <div className="flex flex-col flex-1">
                                <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Статус</label>
                                <select
                                    className="bg-[#F1F4F9] rounded-lg p-2"
                                    value={newTask.status}
                                    onChange={(e) => setNewTask({...newTask, status: parseInt(e.target.value)})}
                                >
                                    <option value={2}>Не начато</option>
                                    <option value={1}>В процессе</option>
                                    <option value={3}>Завершено</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <select
                            className="bg-[#F1F4F9] rounded-lg p-2"
                            value={newTask.assignee}
                            onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                        >
                            <option key="default-assignee" value="">Ответственный</option>
                            {users?.map((user) => (
                                <option key={`assignee-${user.id}`} value={user.id}>
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                    </div>                    

                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            className='bg-[#00D166] text-white p-[7px] rounded-lg'
                            onClick={handleCreateTask}
                        >
                            Создать задачу
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Модальное окно редактирования задачи */}
            <Modal
                isOpen={editTaskModalIsOpen}
                onRequestClose={() => setEditTaskModalIsOpen(false)}
                style={{
                    ...taskModalStyle,
                    content: {
                        ...taskModalStyle.content,
                        height: 'auto',
                        maxHeight: '90vh',
                        overflow: 'hidden'
                    }
                }}
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Название"
                            className="bg-[#F1F4F9] rounded-lg p-2"
                            value={newTask.title}
                            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        />
                    </div>

                    <div className="flex flex-col gap-2 flex-grow min-h-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="bg-[#F1F4F9] rounded-lg p-2 flex-1"
                                value={subtaskInput}
                                onChange={(e) => setSubtaskInput(e.target.value)}
                                placeholder="Подзадача"
                            />
                            <button
                                className=""
                                onClick={handleAddSubtask}
                            >
                                <img 
                                    src={GroupIcon} 
                                    alt="Иконка" 
                                    className=""
                                />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[100px]">
                            {newTask.subtasks.map((subtask, index) => (
                                <div key={index} className="flex items-center gap-2 bg-[#F1F4F9] rounded-lg p-2">
                                    <span className="flex-1">{typeof subtask === 'string' ? subtask : subtask.title}</span>
                                    <button
                                        className="text-red-500"
                                        onClick={() => handleRemoveSubtask(index)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col flex-1">
                            <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Дедлайн</label>
                            <input
                                type="date"
                                className="bg-[#F1F4F9] rounded-lg p-2 w-[112px] h-[34px]"
                                value={newTask.deadline || ''}
                                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Время</label>
                            <input
                                type="time"
                                className="bg-[#F1F4F9] rounded-lg p-2 w-[112px] h-[34px]"
                                value={newTask.deadlineTime || ''}
                                onChange={(e) => setNewTask({...newTask, deadlineTime: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Статус</label>
                            <select
                                className="bg-[#F1F4F9] rounded-lg p-2"
                                value={newTask.status}
                                onChange={(e) => setNewTask({...newTask, status: parseInt(e.target.value)})}
                            >
                                <option value={2}>Не начато</option>
                                <option value={1}>В процессе</option>
                                <option value={3}>Завершено</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <select
                            className="bg-[#F1F4F9] rounded-lg p-2"
                            value={newTask.assignee || ''}
                            onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                        >
                            <option key="default-assignee" value="">Ответственный</option>
                            {users?.map((user) => (
                                <option key={`assignee-${user.id}`} value={user.id}>
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            className="bg-[#F1F4F9] text-[#0D062D] px-6 py-2 rounded-xl"
                            onClick={() => setEditTaskModalIsOpen(false)}
                        >
                            Отмена
                        </button>
                        <button
                            className='bg-[#00D166] text-white p-[7px] rounded-lg'
                            onClick={handleUpdateTask}
                        >
                            Сохранить изменения
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Модальное окно для файлов */}
            <Modal
                isOpen={filesModalIsOpen}
                onRequestClose={() => setFilesModalIsOpen(false)}
                style={filesModalStyle}
                contentLabel="Создание файла"
            >
                <div className="flex flex-col gap-4">
                    <h2 className="font-gilroy_bold text-white text-[32px] leading-[39px] mb-4">Создание файла</h2>
                    <div className="flex flex-col gap-4">
                        <button
                            className="bg-white text-[#0D062D] px-6 py-2 rounded-xl"
                            onClick={() => handleCreateFile('doc', 'Новый документ', 'document')}
                        >
                            Создать документ
                        </button>
                        <button
                            className="bg-white text-[#0D062D] px-6 py-2 rounded-xl"
                            onClick={() => handleCreateFile('sheet', 'Новая таблица', 'spreadsheet')}
                        >
                            Создать таблицу
                        </button>
                        <button
                            className="bg-white text-[#0D062D] px-6 py-2 rounded-xl"
                            onClick={() => handleCreateFile('slide', 'Новая презентация', 'presentation')}
                        >
                            Создать презентацию
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Модальное окно создания папки */}
            <Modal
                isOpen={createFolderModalIsOpen}
                onRequestClose={() => {
                    setCreateFolderModalIsOpen(false);
                    setNewFolderName('');
                }}
                style={taskModalStyle}
            >
                <div className="flex flex-col gap-4">
                    <h2 className="font-gilroy_bold text-[#0D062D] text-[24px] mb-4">Создание папки</h2>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Название папки"
                            className="bg-[#F1F4F9] rounded-lg p-2"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            className="bg-[#F1F4F9] text-[#0D062D] px-6 py-2 rounded-xl"
                            onClick={() => {
                                setCreateFolderModalIsOpen(false);
                                setNewFolderName('');
                            }}
                        >
                            Отмена
                        </button>
                        <button
                            className='bg-[#00D166] text-white p-[7px] rounded-lg'
                            onClick={createFolder}
                        >
                            Создать папку
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Event