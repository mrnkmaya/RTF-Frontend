import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { format, parse } from 'date-fns';
import Modal from 'react-modal';
import { BASE_URL } from "./Globals";

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-[#0D062D]';

const filesModalWindowStyle = {
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

const taskModalStyle = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#FFFFFF',
        width: '610px',
        borderRadius: '24px',
        border: 'none',
        padding: '24px 32px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }
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

    const [event, setEvent] = useState([]);
    const [users, setUsers] = useState([]);
    const [project, setProject] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isFolderOpen, setIsFolderOpen] = useState(false);
    const [filesModalIsOpen, setFilesModalIsOpen] = useState(false);
    const [taskModalIsOpen, setTaskModalIsOpen] = useState(false);
    const [editTaskModalIsOpen, setEditTaskModalIsOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        deadline: '',
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
                            const taskDetails = JSON.parse(task.task);
                            console.log('Распарсенные детали задачи:', taskDetails);
                            
                            return {
                                id: task.id,
                                title: taskDetails.title,
                                description: taskDetails.description,
                                deadline: taskDetails.deadline,
                                status: taskDetails.status,
                                user: taskDetails.user,
                                assignee: taskDetails.user,
                                subtasks: taskDetails.subtasks || [],
                                task: task.task // сохраняем оригинальную строку JSON
                            };
                        } catch (error) {
                            console.error('Ошибка при обработке задачи:', error);
                            return task; // возвращаем задачу как есть в случае ошибки
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

    function createFile(type, title, custom_name) {
        // Получаем первый проект из списка (или другой логически правильный выбор)
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
        
        // Используем правильный endpoint согласно бэкенду
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
    }

    function createFolder() {
        const data = { 
            title: document.getElementById('folderName').value,
            event_id: eventData.id
        };
        axios.post(`${BASE_URL}/projects/create/`, data, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        } ,{ withCredentials: true })
        .then(response => {
            document.getElementById('folderName').value = '';
            const message = document.getElementById('succes_folder');
            message.classList.remove('hidden');
            setTimeout(() => {
                message.classList.add('hidden');
            }, 3000);
        })
        .catch(error => { 
            console.error('There was an error!', error);
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
                subtasks: [...newTask.subtasks, subtaskInput.trim()]
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
        console.log('Начало создания задачи:', newTask);
        
        const taskData = {
            task: JSON.stringify({
                title: newTask.title,
                description: newTask.description,
                deadline: newTask.deadline,
                status: newTask.status,
                user: newTask.assignee,
                subtasks: newTask.subtasks
            }),
            event: eventData.id
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
            
            // Обновляем список задач в событии
            const updatedEvent = {
                ...event,
                tasks: [...(event.tasks || []), {
                    id: response.data.id,
                    title: newTask.title,
                    description: newTask.description,
                    deadline: newTask.deadline,
                    status: newTask.status,
                    user: newTask.assignee,
                    subtasks: newTask.subtasks,
                    task: taskData.task
                }]
            };
            
            console.log('Обновленное событие:', updatedEvent);
            setEvent(updatedEvent);
            
            // Сбрасываем форму
            setNewTask({
                title: '',
                description: '',
                deadline: '',
                status: 2,
                assignee: '',
                subtasks: []
            });
            setTaskModalIsOpen(false);
        })
        .catch(error => {
            console.error('Ошибка при создании задачи:', error);
            console.error('Детали ошибки:', error.response?.data);
            console.error('Статус ошибки:', error.response?.status);
            alert('Не удалось создать задачу. Пожалуйста, проверьте данные и попробуйте снова.');
        });
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setNewTask({
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            status: task.status,
            assignee: task.user,
            subtasks: task.subtasks
        });
        setEditTaskModalIsOpen(true);
    };

    const handleUpdateTask = () => {
        if (!newTask.title) {
            alert('Название задачи обязательно для заполнения');
            return;
        }

        const taskObject = {
            title: newTask.title,
            description: newTask.description || "",
            deadline: newTask.deadline || null,
            status: newTask.status,
            user: newTask.assignee || null,
            event: eventData.id,
            subtasks: newTask.subtasks.map(st => st.title)
        };

        const taskData = {
            task: JSON.stringify(taskObject),
            event: eventData.id.toString()
        };

        axios.put(`${BASE_URL}/api/tasks/${selectedTask.id}/`, taskData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            const taskDetails = JSON.parse(response.data.task);
            const updatedTask = {
                id: response.data.id,
                title: taskDetails.title,
                description: taskDetails.description,
                deadline: taskDetails.deadline,
                status: taskDetails.status,
                user: taskDetails.user,
                assignee: taskDetails.user,
                subtasks: taskDetails.subtasks || []
            };

            setEvent(prevEvent => ({
                ...prevEvent,
                tasks: prevEvent.tasks.map(task => 
                    task.id === selectedTask.id ? updatedTask : task
                )
            }));

            setEditTaskModalIsOpen(false);
            setNewTask({
                title: '',
                description: '',
                deadline: '',
                status: 2,
                assignee: '',
                subtasks: []
            });
            setSelectedTask(null);
        })
        .catch(error => {
            console.error('Ошибка при обновлении задачи:', error);
            alert('Не удалось обновить задачу. Пожалуйста, проверьте введенные данные и попробуйте снова.');
        });
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
                <div className="flex justify-between gap-6">
                    {/* Левая колонка с информацией о мероприятии */}
                    <div className="w-[400px]">
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
                        : <p className="font-gilroy_bold text-[24px] text-[#0D062D] leading-[30px] mb-[12px]">{event.description}</p>
                        }
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Организаторы</p>
                        {isEditing
                        ?
                        <div>
                            {event.organizers?.map((org) => {
                                return <p key={org} className="text-[#0D062D] font-gilroy_semibold text-[22px] leading-[27px] mb-3">{orgs[org]}</p>
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
                                    <option key={user.id} value={user.id}>
                                    {user.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        :
                        event.organizers?.map((org) => {
                            return <p key={org} className="text-[#0D062D] font-gilroy_semibold text-[22px] leading-[27px] mb-3">{orgs[org]}</p>
                        })
                        }
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Папки</p>
                        <div className="flex flex-col">
                            {event.projects?.map((proId) => {
                                return <Link key={proId} to={`/folder?projid=${proId}&eventid=${event.id}`} className="bg-[#CCE8FF] w-[200px] h-fit rounded-xl px-[12px] py-[8px] text-[#0D062D] font-gilroy_semibold font-[20px] leading-[25px] mb-3"
                                onClick={() => {setIsFolderOpen(true)}}>{projects[proId]?.title}</Link>
                            })}
                        </div>
                        {isEditing &&
                            <form id='folderForm'>
                                <input className="bg-[#F1F1F1] rounded mr-[10px]" type="text" id="folderName" required/>
                                <button type="button" onClick={(evt) => {createFolder()}} className={`${buttonStyle}`}>Создать</button>
                            </form>
                        }
                    </div>

                    {/* Центральная колонка с задачами */}
                    <div className="w-[395px] max-h-[684px] bg-[#F4F4F4] rounded-[15px] p-[10px] gap-[10px] absolute top-[116px] left-[654px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-[#56B0FF] h-[11px] w-[11px] rounded-full flex-shrink-0"/>
                                <h3 className="font-gilroy_semibold text-[#0D062D] text-[27px]">Задачи</h3>
                            </div>
                            {isEditing && (
                                <button 
                                    className="w-[32px] h-[32px] bg-[#0077EB] rounded-xl flex items-center justify-center"
                                    onClick={() => setTaskModalIsOpen(true)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                            {event.tasks?.map((task) => (
                                <div 
                                    key={task.id} 
                                    className="bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleEditTask(task)}
                                >
                                    <h3 className={`${textStyleSemibold} text-[20px] mb-2`}>{task.title}</h3>
                                    <p className="text-[#0D062D] text-opacity-70 text-[14px] mb-2">{task.description}</p>
                                    
                                    {/* Отображение исполнителя */}
                                    {task.user && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[#0D062D] text-opacity-50 text-sm">Исполнитель:</span>
                                            <span className="text-[#0D062D] text-sm">{orgs[task.user]}</span>
                                        </div>
                                    )}
                                    
                                    {/* Отображение подзадач */}
                                    {task.subtasks && task.subtasks.length > 0 && (
                                        <div className="mb-2">
                                            <span className="text-[#0D062D] text-opacity-50 text-sm">Подзадачи:</span>
                                            <ul className="list-disc list-inside mt-1">
                                                {task.subtasks.map((subtask, index) => (
                                                    <li key={index} className="text-[#0D062D] text-sm">{subtask}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`text-sm px-2 py-1 rounded-full ${
                                            task.status === 1 ? 'bg-yellow-100 text-yellow-800' :
                                            task.status === 2 ? 'bg-red-100 text-red-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {task.status === 1 ? 'В работе' :
                                             task.status === 2 ? 'Не начато' :
                                             'Завершено'}
                                        </span>
                                        {task.deadline && (
                                            <p className="text-[#0D062D] text-opacity-50 text-xs">
                                                {new Date(task.deadline).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Правая колонка со статусом */}
                    <div className="flex flex-col gap-4">
                        <div className={`w-[186px] h-[54px] rounded-xl items-center p-3
                            ${event.is_past ? 'bg-[#2B4733]'  : 'bg-[#5C5838]' }`}>
                            <p className={`${textStyleSemibold} text-center text-[28px] leading-[34px]`}>
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
                onRequestClose={() => setTaskModalIsOpen(false)}
                style={taskModalStyle}
                contentLabel="Создание задачи"
            >
                <div className="flex flex-col gap-4">
                    <h2 className="font-gilroy_bold text-[#0D062D] text-[32px] leading-[39px] mb-4">Создание задачи</h2>
                    
                    <div className="flex flex-col gap-2">
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Название задачи</label>
                        <input
                            type="text"
                            className="bg-[#F1F4F9] rounded-lg p-2"
                            value={newTask.title}
                            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Описание</label>
                        <textarea
                            className="bg-[#F1F4F9] rounded-lg p-2 min-h-[100px]"
                            value={newTask.description}
                            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Дедлайн</label>
                            <input
                                type="date"
                                className="bg-[#F1F4F9] rounded-lg p-2"
                                value={newTask.deadline}
                                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                            />
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
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
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Исполнитель</label>
                        <select
                            className="bg-[#F1F4F9] rounded-lg p-2"
                            value={newTask.assignee}
                            onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                        >
                            <option value="">Выберите исполнителя</option>
                            {users?.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Подзадачи</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="bg-[#F1F4F9] rounded-lg p-2 flex-1"
                                value={subtaskInput}
                                onChange={(e) => setSubtaskInput(e.target.value)}
                                placeholder="Введите подзадачу"
                            />
                            <button
                                className="bg-[#0077EB] text-white rounded-lg px-4"
                                onClick={handleAddSubtask}
                            >
                                Добавить
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
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

                    <div className="flex justify-end gap-4 mt-4">
                        <button
                            className="bg-[#F1F4F9] text-[#0D062D] px-6 py-2 rounded-xl"
                            onClick={() => setTaskModalIsOpen(false)}
                        >
                            Отмена
                        </button>
                        <button
                            className={`${buttonStyle}`}
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
                style={taskModalStyle}
                contentLabel="Редактирование задачи"
            >
                <div className="flex flex-col gap-4">
                    <h2 className="font-gilroy_bold text-[#0D062D] text-[32px] leading-[39px] mb-4">Редактирование задачи</h2>
                    
                    <div className="flex flex-col gap-2">
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Название задачи</label>
                        <input
                            type="text"
                            className="bg-[#F1F4F9] rounded-lg p-2"
                            value={newTask.title}
                            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Описание</label>
                        <textarea
                            className="bg-[#F1F4F9] rounded-lg p-2 min-h-[100px]"
                            value={newTask.description}
                            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Дедлайн</label>
                            <input
                                type="date"
                                className="bg-[#F1F4F9] rounded-lg p-2"
                                value={newTask.deadline || ''}
                                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                            />
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
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
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Исполнитель</label>
                        <select
                            className="bg-[#F1F4F9] rounded-lg p-2"
                            value={newTask.assignee || ''}
                            onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                        >
                            <option value="">Выберите исполнителя</option>
                            {users?.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Подзадачи</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="bg-[#F1F4F9] rounded-lg p-2 flex-1"
                                value={subtaskInput}
                                onChange={(e) => setSubtaskInput(e.target.value)}
                                placeholder="Введите подзадачу"
                            />
                            <button
                                className="bg-[#0077EB] text-white rounded-lg px-4"
                                onClick={handleAddSubtask}
                            >
                                Добавить
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
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

                    <div className="flex justify-end gap-4 mt-4">
                        <button
                            className="bg-[#F1F4F9] text-[#0D062D] px-6 py-2 rounded-xl"
                            onClick={() => setEditTaskModalIsOpen(false)}
                        >
                            Отмена
                        </button>
                        <button
                            className={`${buttonStyle}`}
                            onClick={handleUpdateTask}
                        >
                            Сохранить изменения
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Event