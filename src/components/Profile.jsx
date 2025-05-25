import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import avatar_placeholder from "../photos/avatar_placeholder.png";
import { BASE_URL } from "./Globals";
import { Link } from "react-router-dom";
import Modal from "react-modal";

const H3_STYLE = 'font-gilroy_semibold text-[#0D062D] opacity-50 text-[16px] leading-[19px] mb-[6px]';
const DATA_STYLE = 'font-gilroy_semibold text-[#0D062D] text-[24px] leading-[17px]';
const BUTTON_STYLE = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const INPUT_FIELD_STYLE = " h-[40px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8]";

const checkPlaceholder = (data) => data || 'Не указано';

const Profile = () => {
    const [profileData, setProfileData] = useState({});
    const [events, setEvents] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('events');
    const [users, setUsers] = useState({});
    const [project, setProject] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [editTaskModalIsOpen, setEditTaskModalIsOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        deadline: '',
        deadlineTime: '',
        status: 2,
        assignee: '',
        subtasks: []
    });

    const updateSubtaskStatus = async (taskId, subtaskIndex, newStatus) => {
        try {
            // Получаем текущую задачу
            const currentTask = tasks.find(t => t.id === taskId);
            if (!currentTask) return;

            // Создаем копию подзадач с обновленным статусом
            const updatedSubtasks = currentTask.subtasks.map((subtask, idx) => {
                if (idx === subtaskIndex) {
                    return {
                        ...subtask,
                        status: newStatus
                    };
                }
                return subtask;
            });

            // Получаем текущие данные задачи
            let existingTaskData;
            try {
                const taskResponse = await axios.get(`${BASE_URL}/api/tasks/${taskId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                existingTaskData = taskResponse.data;
            } catch (error) {
                console.error('Ошибка при получении данных задачи:', error);
                existingTaskData = currentTask;
            }

            // Создаем объект задачи, сохраняя существующего ответственного
            const taskObject = {
                title: currentTask.title,
                description: currentTask.description || '',
                deadline: currentTask.deadline,
                status: currentTask.status,
                executor: existingTaskData.executor || currentTask.executor, // Используем существующего ответственного
                event: currentTask.event,
                subtasks: updatedSubtasks
            };

            // Отправляем данные на сервер
            const response = await axios.put(`${BASE_URL}/api/tasks/${taskId}/`, {
                task: JSON.stringify(taskObject),
                status: currentTask.status,
                executor: existingTaskData.executor || currentTask.executor, // Используем существующего ответственного
                event: currentTask.event
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            // Обновляем локальное состояние
            const updatedTasks = tasks.map(t => {
                if (t.id === taskId) {
                    return {
                        ...t,
                        subtasks: updatedSubtasks,
                        task: JSON.stringify(taskObject),
                        executor: existingTaskData.executor || currentTask.executor // Обновляем локальное состояние с правильным ответственным
                    };
                }
                return t;
            });
            setTasks(updatedTasks);

            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении статуса подзадачи:', error);
            throw error;
        }
    };

    const currentUserAccessLevel = parseInt(localStorage.getItem('access_level') || '1');
    const currentUserProfileId = localStorage.getItem('profile_id');
    const viewedProfileId = searchParams.get('id') || currentUserProfileId;
    const isOwnProfile = viewedProfileId === currentUserProfileId;

    // Проверка прав доступа
    useEffect(() => {
        if (!localStorage.getItem('access_token')) {
            navigate('/');
            return;
        }

        // Для 1 уровня - запрещаем просмотр чужих профилей
        if (currentUserAccessLevel === 1 && !isOwnProfile) {
            navigate('/team');
            return;
        }
    }, [currentUserAccessLevel, isOwnProfile, navigate]);

    const canEdit = () => {
        return isOwnProfile || currentUserAccessLevel >= 2; //&&??
    };

    const getEditableFields = () => {
        
        return {
            commission: true, // Все могут менять комиссию
            date_of_birth: isOwnProfile, // Только свои данные
            number_phone: isOwnProfile,
            email: isOwnProfile,
            adress: isOwnProfile,
            status: true // Все могут менять должность
        };
    };

    const editableFields = getEditableFields();
{/*ФУНКИЦИ ЗАГРУЗКИ ДАННЫХ!! не трогать*/}
    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
                // Получаем список пользователей
                const usersResponse = await axios.get(`${BASE_URL}/api/users/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                // Создаем объект с пользователями, где ключ - ID пользователя
                const usersMap = {};
                usersResponse.data.forEach(user => {
                    usersMap[user.id] = user;
                });
                setUsers(usersMap);

                const endpoint = isOwnProfile 
                    ? `${BASE_URL}/api/profile/${viewedProfileId}/`
                    : `${BASE_URL}/api/profile_view/${viewedProfileId}/`;
                
                const response = await axios.get(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });

                const tasksResponse = await axios.get(`${BASE_URL}/api/tasks/`, {
                    params: {
                        user_id: viewedProfileId
                    },
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                console.log('Raw task data:', tasksResponse.data);

                const proj = await axios.get(`${BASE_URL}/projects/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setProject(proj.data);
                
                console.log('Полученные задачи:', tasksResponse.data);
                console.log('ID просматриваемого профиля:', viewedProfileId);
                
                // Обрабатываем задачи
                const processedTasks = tasksResponse.data
                    .map(task => {
                        try {
                            let taskDetails;
                            if (typeof task.task === 'string') {
                                try {
                                    taskDetails = JSON.parse(task.task);
                                } catch (e) {
                                    taskDetails = {
                                        title: task.task,
                                        description: '',
                                        deadline: null,
                                        status: task.status || 2,
                                        executor: task.executor,
                                        subtasks: []
                                    };
                                }
                            } else {
                                taskDetails = task;
                            }

                            // Приводим к единому формату
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

                            return {
                                id: task.id,
                                title: taskDetails.title || 'Без названия',
                                description: taskDetails.description || '',
                                deadline: taskDetails.deadline || null,
                                status: taskDetails.status || task.status || 2,
                                executor: taskDetails.executor || task.executor || null,
                                event: taskDetails.event || task.event || null,
                                subtasks: taskDetails.subtasks || [],
                                task: typeof task.task === 'string' ? task.task : JSON.stringify(taskDetails)
                            };
                        } catch (error) {
                            console.error('Ошибка при обработке задачи:', error);
                            return null;
                        }
                    })
                    .filter(task => task !== null);
                
                console.log('Обработанные задачи:', processedTasks);
                
                setProfileData(response.data.profile);
                setEvents(response.data.events || []);
                setTasks(processedTasks);
            } catch (error) {
                console.error("Ошибка загрузки данных:", error);
                if (error.response?.status === 403) {
                    navigate('/team');
                }
            } finally {
                setIsLoading(false);
            }
        };
    
        fetchProfileData();
    }, [viewedProfileId, isOwnProfile, navigate]);

    let projects = {};
    for (const pro of project) {
        projects[pro.id] = pro;
    }

    {/*ФУНКИЦИ ЗАГРУЗКИ ДАННЫХ!! не трогать*/}
    const handleSave = async () => {
        setIsLoading(true);
        try {
            const endpoint = isOwnProfile 
                ? `${BASE_URL}/api/profile/${viewedProfileId}/`
                : `${BASE_URL}/api/profile_view/${viewedProfileId}/`;
            
            const payload = {
                status: profileData.status || null,
                commission: profileData.commission || null,
                ...(isOwnProfile && {
                    date_of_birth: profileData.date_of_birth || null,
                    number_phone: profileData.number_phone || null,
                    email: profileData.email || null,
                    adress: profileData.adress || null
                })
            };
    
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });
    
            if (profileData.profile_photo instanceof File) {
                formData.append('profile_photo', profileData.profile_photo);
            }
    
            const response = await axios.put(endpoint, formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            setProfileData(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error("Ошибка сохранения:", error.response?.data || error.message);
            alert(`Ошибка сохранения: ${error.response?.data?.status?.[0] || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

{/*ФУНКИЦИ ЗАГРУЗКИ ДАННЫХ!! не трогать*/}
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProfileData({...profileData, profile_photo: e.target.files[0]});
        }
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
            const deadlineString = newTask.deadline ? (newTask.deadline + (newTask.deadlineTime ? 'T' + newTask.deadlineTime : '')) : null;
            const taskObject = {
                t: newTask.title.trim(),
                d: newTask.description?.trim() || '',
                dl: deadlineString,
                s: newTask.status || 2,
                e: newTask.assignee || null,
                ev: selectedTask.event || '',
                st: newTask.subtasks.map(subtask => ({
                    t: (subtask.title || '').trim(),
                    s: subtask.status || 2
                }))
            };
            const taskJson = JSON.stringify(taskObject);
            const taskData = {
                task: taskJson,
                event: selectedTask.event,
                executor: newTask.assignee || null
            };
            axios.put(`${BASE_URL}/api/tasks/${selectedTask.id}/`, taskData, {
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
                setTasks(prevTasks => prevTasks.map(t => 
                    t.id === selectedTask.id ? updatedTask : t
                ));
                setEditTaskModalIsOpen(false);
            })
            .catch(error => {
                console.error('Ошибка при обновлении задачи:', error);
                alert('Не удалось обновить задачу. Пожалуйста, попробуйте снова.');
            });
        } catch (error) {
            console.error('Ошибка при обработке задачи:', error);
            alert('Не удалось обновить задачу. Пожалуйста, попробуйте снова.');
        }
    };

    const renderTasks = () => {
        return (
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-4">Не начато</h3>
                    <div className="space-y-3">
                        {tasks.filter(task => task.status === 2 && String(task.executor) === String(viewedProfileId)).map((task) => (
                            <Link
                                key={task.id}
                                to={`/event?id=${task.event}`}
                                className="block bg-[#F4F4F4] p-3 rounded-lg"
                            >
                                <h4 className="font-gilroy_semibold text-[#0D062D]">{task.title}</h4>
                                <p className="text-[#0D062D] text-opacity-50 text-sm mt-1">{task.description}</p>
                                {task.deadline && (
                                    <p className="text-[#0D062D] text-opacity-50 text-xs mt-2">
                                        Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-4">В процессе</h3>
                    <div className="space-y-3">
                        {tasks.filter(task => task.status === 1 && String(task.executor) === String(viewedProfileId)).map((task) => (
                            <Link
                                key={task.id}
                                to={`/event?id=${task.event}`}
                                className="block bg-[#F4F4F4] p-3 rounded-lg"
                            >
                                <h4 className="font-gilroy_semibold text-[#0D062D]">{task.title}</h4>
                                <p className="text-[#0D062D] text-opacity-50 text-sm mt-1">{task.description}</p>
                                {task.deadline && (
                                    <p className="text-[#0D062D] text-opacity-50 text-xs mt-2">
                                        Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-4">Завершено</h3>
                    <div className="space-y-3">
                        {tasks.filter(task => task.status === 3 && String(task.executor) === String(viewedProfileId)).map((task) => (
                            <Link
                                key={task.id}
                                to={`/event?id=${task.executor}`}
                                className="block bg-[#F4F4F4] p-3 rounded-lg"
                            >
                                <h4 className="font-gilroy_semibold text-[#0D062D]">{task.title}</h4>
                                <p className="text-[#0D062D] text-opacity-50 text-sm mt-1">{task.description}</p>
                                {task.deadline && (
                                    <p className="text-[#0D062D] text-opacity-50 text-xs mt-2">
                                        Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="bg-[#ECF2FF] w-screen h-screen flex items-center justify-center">
                <div className="text-[#0D062D] text-2xl">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="bg-[#ECF2FF] w-screen h-auto p-6">
            <div className="w-[1283px] h-auto bg-[#FFFFFF] rounded-3xl p-6 mb-6">
                <div className="flex items-center mb-3">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className="font-gilroy_semibold text-[#0D062D] text-[32px] mr-auto leading-[38px]">
                        {isOwnProfile ? 'Мой профиль' : 'Профиль пользователя'}
                    </h1>
                    
                    {canEdit() && (
                        <button
                            className={`${BUTTON_STYLE} ${isLoading ? 'opacity-50' : ''}`}
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Редактировать'}
                        </button>
                    )}
                </div>

                <div className="flex flex-row items-start gap-6">
                    <div className="relative w-[185px] h-[185px]">
                    <div className="relative w-full h-full overflow-hidden rounded-full">
                        <img
                            src={profileData.profile_photo 
                                ? profileData.profile_photo instanceof File 
                                    ? URL.createObjectURL(profileData.profile_photo)
                                    : `${BASE_URL}${profileData.profile_photo}`
                                : avatar_placeholder}
                            width="185"
                            height="185"
                            alt="Фото профиля"
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover"
                        />
                        </div>
                        {isEditing && isOwnProfile &&(
                            <div className="absolute bottom-0 right-0">
                                <label className={`${BUTTON_STYLE} `}>
                                    Изменить
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col">
                        <h2 className="font-gilroy_semibold text-[#0D062D] text-[32px] leading-[38px] mb-6">
                            {checkPlaceholder(profileData.full_name)}
                        </h2>
                        
                        <div className="flex flex-row gap-6 mb-6">
                            <div>
                            <h3 className={H3_STYLE}>Должность</h3>
                            {isEditing && editableFields.status ? (
                                <select
                                    className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`}
                                    value={profileData.status || ''}
                                    onChange={(e) => 
                                        setProfileData({
                                        ...profileData,
                                        status: e.target.value
                                    })}
                                >
                                    <option value="">Не указано</option>
                                    <option value="Председатель">Председатель</option>
                                    <option value="Заместитель председателя">Заместитель председателя</option>
                                    <option value="Член комиссии">Член комиссии</option>
                                </select>
                        ) : (
                            <p className={DATA_STYLE}>{checkPlaceholder(profileData.status)}</p>
                        )}                        
                        </div>
                            <div>
                                <h3 className={H3_STYLE}>Комиссия</h3>
                                {isEditing && editableFields.commission ? (
                                    <select
                                    className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`}
                                    value={profileData.commission || ''}
                                    onChange={(e) => setProfileData({
                                        ...profileData,
                                        commission: e.target.value
                                    })}
                                    >
                                    <option value="">-</option>
                                    <option value="По техническому обеспечению проектов">По техническому обеспечению проектов</option>
                                    <option value="По работе с партнерами">По работе с партнерами</option>
                                    <option value="По культурно-массовой работе">По культурно-массовой работе</option>
                                    <option value="По работе с наставниками">По работе с наставниками</option>
                                    <option value="Учебно-научная">Учебно-научная</option>
                                    <option value="Жилищно-бытовая">Жилищно-бытовая</option>
                                    <option value="Спортивно-массовая">Спортивно-массовая</option>
                                    <option value="Организационно-массовая">Организационно-массовая</option>
                                    <option value="Социально правовая">Социально правовая</option>
                                    </select>
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(profileData.commission)}</p>
                                )}
                            </div>                          
                        </div>
                        
                        <div className="flex flex-row gap-4">
                            <div>
                                <h3 className={H3_STYLE}>Номер телефона</h3>
                                {isEditing && editableFields.number_phone ? (
                                    <input
                                        className={`${INPUT_FIELD_STYLE} w-[200px] pl-[10px]`}
                                        value={profileData.number_phone || ''}
                                        onChange={(e) => setProfileData({
                                            ...profileData,
                                            number_phone: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(profileData.number_phone)}</p>
                                )}
                            </div>
                            
                            <div>
                                <h3 className={H3_STYLE}>Почта</h3>
                                {isEditing && editableFields.email ? (
                                    <input
                                        type="email"
                                        className={`${INPUT_FIELD_STYLE} w-[200px] pl-[10px]`}
                                        value={profileData.email || ''}
                                        onChange={(e) => setProfileData({
                                            ...profileData,
                                            email: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(profileData.email)}</p>
                                )}
                            </div>
                            <div>
                                <h3 className={H3_STYLE}>День рождения</h3>
                                {isEditing && editableFields.date_of_birth ? (
                                    <input
                                        type="date"
                                        className={`${INPUT_FIELD_STYLE} w-[200px] pl-[10px]`}
                                        value={profileData.date_of_birth || ''}
                                        onChange={(e) => setProfileData({
                                            ...profileData,
                                            date_of_birth: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(new Date(profileData.date_of_birth).toLocaleDateString())}</p>
                                )}
                                {}
                            </div>
                            <div>
                                <h3 className={H3_STYLE}>Адрес</h3>
                                {isEditing && editableFields.adress ? (
                                    <input
                                        className={`${INPUT_FIELD_STYLE} w-[200px] pl-[10px]`}
                                        value={profileData.adress || ''}
                                        onChange={(e) => setProfileData({
                                            ...profileData,
                                            adress: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(profileData.adress)}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Блок мероприятий */}
            {currentUserAccessLevel >= 1 && (
                <div className="w-[956px] h-auto bg-[#FFFFFF] rounded-3xl p-6">
                    <div className="flex items-center mb-6">
                        <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                        <div className="flex rounded-lg p-1 gap-2">
                        <button
                                className={`font-gilroy_semibold text-[#0D062D] text-[32px] leading-[38px] ${activeTab === 'tasks' ? '' : 'font-gilroy_semibold text-[#929292] text-[32px] leading-[38px]'}`}
                                onClick={() => setActiveTab('tasks')}
                            >
                                Задачи
                            </button>
                            <button
                                className={`font-gilroy_semibold text-[#0D062D] text-[32px] leading-[38px] ${activeTab === 'events' ?  '' : 'font-gilroy_semibold text-[#929292] text-[32px] leading-[38px]'}`}
                                onClick={() => setActiveTab('events')}
                            >
                                Мероприятия
                            </button>
                            
                        </div>
                    </div>

                    {activeTab === 'events' ? (
                    events.length > 0 ? (
                        <div className="grid grid-cols-3 gap-6">
                            {events.map(event => (
                            <Link 
                                key={event.id} 
                                to={`/event?id=${event.id}`} 
                                className="flex flex-col bg-[#CCE8FF] p-3 rounded-xl hover:bg-[#b3d9ff] transition-colors h-[150px]"
                            >
                                <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-2">{event.title}</h3>
                                
                                <p className="text-[#0D062D] text-opacity-70 text-[14px] flex-grow overflow-hidden break-words">
                                                    <span className="line-clamp-2">
                                                        {event.description}
                                                    </span>
                                                </p>
                                <p className="text-[#0D062D] text-opacity-50 text-xs mt-2">
                                    {new Date(event.date).toLocaleDateString()}
                                </p>
                            </Link>
                        ))}
                        </div>
                    ) : (
                        <p className="text-[#0D062D] text-opacity-50">
                            {isOwnProfile 
                                ? 'У вас пока нет мероприятий' 
                                : 'У пользователя нет мероприятий'}
                        </p>
                    )
                    ) : (
                    <div className="grid grid-cols-3 gap-[23px] h-[calc(100vh-300px)] overflow-hidden">
                        {/* Колонка "Не начато" */}
                        <div className="bg-[#F4F4F4] p-[10px] rounded-lg flex flex-col h-full overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-[#FF7D56] h-[11px] w-[11px] rounded-full flex-shrink-0"/>
                                <h3 className="font-gilroy_semibold text-[#0D062D] text-[27px]">Не начато</h3>
                            </div>
                            <div className="overflow-y-auto flex-1 pr-2">
                                {tasks
                                    .filter(task => task.status === 2 && String(task.executor) === String(viewedProfileId))
                                    .map((task, index) => (
                                        <div
                                            key={`task-${task.id}-not-started`}
                                            className="flex flex-col bg-white p-3 rounded-xl mb-3"
                                        >
                                            <Link to={`/event?id=${task.event}`} className="block mb-2">
                                                <h3 className="font-gilroy_semibold text-[#0D062D] text-[14px] leading-[100%] hover:underline">
                                            {task.title || task.t || 'Без названия'}
                                        </h3>
                                            </Link>
                                            <div className="cursor-pointer" onClick={() => handleEditTask(task)}>
                                                <span className="text-[#0D062D] text-opacity-50 text-sm transition-all duration-200 hover:text-green-600 hover:underline cursor-pointer">Редактировать</span>
                                            </div>
                                        {task.subtasks && task.subtasks.length > 0 && (
                                            <div className="mb-2">
                                                {task.subtasks.slice(0, 3).map((subtask, index) => (
                                                    <div key={index} className="flex items-center gap-2 mb-1">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-[#0D062D]"
                                                            checked={typeof subtask === 'object' ? subtask.status === 3 : false}
                                                            onChange={async (e) => {
                                                                try {
                                                                    const newStatus = e.target.checked ? 3 : 2;
                                                                    // Формируем сокращённый объект задачи
                                                                    const taskObject = {
                                                                        t: task.title || task.t || '',
                                                                        d: task.description || task.d || '',
                                                                        dl: (task.deadlineTime ? `${task.deadline}T${task.deadlineTime}` : task.deadline) || task.dl || null,
                                                                        s: task.status || task.s || 2,
                                                                        e: task.executor || task.e || null,
                                                                        ev: task.event || task.ev || null,
                                                                        st: task.subtasks.map((st, i) => ({
                                                                            t: (typeof st === 'object' ? st.title : st) || '',
                                                                            s: i === index ? newStatus : (typeof st === 'object' ? st.status : 2)
                                                                        }))
                                                                    };
                                                                    const taskData = {
                                                                        task: JSON.stringify(taskObject),
                                                                        event: task.event || task.ev || '',
                                                                        executor: task.executor || task.e || null
                                                                    };
                                                                    await axios.put(`${BASE_URL}/api/tasks/${task.id}/`, taskData, {
                                                                        headers: {
                                                                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                                                            'Content-Type': 'application/json'
                                                                        }
                                                                    });
                                                                    // Обновляем только локальное состояние
                                                                    setTasks(prevTasks => prevTasks.map(t => {
                                                                        if (t.id === task.id) {
                                                                            const updatedSubtasks = t.subtasks.map((st, i) =>
                                                                                i === index ? { ...st, status: newStatus } : st
                                                                            );
                                                                            return { ...t, subtasks: updatedSubtasks };
                                                                        }
                                                                        return t;
                                                                    }));
                                                                } catch (error) {
                                                                    // Можно добавить обработку ошибки
                                                                }
                                                            }}
                                                        />
                                                        <span className="font-gilroy_semibold text-[#0D062D] text-[12px] leading-[100%] mb-1">
                                                            {typeof subtask === 'object' ? subtask.title : subtask}
                                                        </span>
                                                    </div>
                                                ))}
                                                {task.subtasks.length > 3 && (
                                                    <div className="flex items-left justify-left text-[#0D062D] text-opacity-50 text-lg">...</div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center mt-2">
                                            {task.deadline && (
                                                <div className="bg-[#FFA500] text-white px-2 py-1 rounded text-[12px] w-[80px] h-[23px] flex items-center justify-center">
                                                    {new Date(task.deadline).toLocaleString('ru-RU', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false
                                                    }).replace(',', '')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {tasks.filter(task => task.status === 2 && String(task.executor) === String(viewedProfileId)).length === 0 && (
                                    <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                                )}
                            </div>
                        </div>

                        {/* Колонка "В работе" */}
                        <div className="bg-[#F4F4F4] p-[10px] rounded-lg flex flex-col h-full overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-[#FFDF56] h-[11px] w-[11px] rounded-full flex-shrink-0"/>
                                <h3 className="font-gilroy_semibold text-[#0D062D] text-[27px]">В работе</h3>
                            </div>
                            <div className="overflow-y-auto flex-1 pr-2">
                                {tasks
                                    .filter(task => task.status === 1 && String(task.executor) === String(viewedProfileId))
                                    .map((task, index) => (
                                        <div
                                            key={task.id}
                                            className="flex flex-col bg-white p-3 rounded-xl mb-3"
                                        >
                                            <Link to={`/event?id=${task.event}`} className="block mb-2">
                                                <h3 className="font-gilroy_semibold text-[#0D062D] text-[14px] leading-[100%] hover:underline">
                                            {task.title || task.t || 'Без названия'}
                                        </h3>
                                            </Link>
                                            <div className="cursor-pointer" onClick={() => handleEditTask(task)}>
                                                <span className="text-[#0D062D] text-opacity-50 text-sm transition-all duration-200 hover:text-green-600 hover:underline cursor-pointer">Редактировать</span>
                                            </div>
                                        {task.subtasks && task.subtasks.length > 0 && (
                                            <div className="mb-2">
                                                {task.subtasks.slice(0, 3).map((subtask, index) => (
                                                    <div key={index} className="flex items-center gap-2 mb-1">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-[#0D062D]"
                                                            checked={typeof subtask === 'object' ? subtask.status === 3 : false}
                                                            onChange={async (e) => {
                                                                try {
                                                                    const newStatus = e.target.checked ? 3 : 2;
                                                                    // Формируем сокращённый объект задачи
                                                                    const taskObject = {
                                                                        t: task.title || task.t || '',
                                                                        d: task.description || task.d || '',
                                                                        dl: (task.deadlineTime ? `${task.deadline}T${task.deadlineTime}` : task.deadline) || task.dl || null,
                                                                        s: task.status || task.s || 2,
                                                                        e: task.executor || task.e || null,
                                                                        ev: task.event || task.ev || null,
                                                                        st: task.subtasks.map((st, i) => ({
                                                                            t: (typeof st === 'object' ? st.title : st) || '',
                                                                            s: i === index ? newStatus : (typeof st === 'object' ? st.status : 2)
                                                                        }))
                                                                    };
                                                                    const taskData = {
                                                                        task: JSON.stringify(taskObject),
                                                                        event: task.event || task.ev || '',
                                                                        executor: task.executor || task.e || null
                                                                    };
                                                                    await axios.put(`${BASE_URL}/api/tasks/${task.id}/`, taskData, {
                                                                        headers: {
                                                                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                                                            'Content-Type': 'application/json'
                                                                        }
                                                                    });
                                                                    // Обновляем только локальное состояние
                                                                    setTasks(prevTasks => prevTasks.map(t => {
                                                                        if (t.id === task.id) {
                                                                            const updatedSubtasks = t.subtasks.map((st, i) =>
                                                                                i === index ? { ...st, status: newStatus } : st
                                                                            );
                                                                            return { ...t, subtasks: updatedSubtasks };
                                                                        }
                                                                        return t;
                                                                    }));
                                                                } catch (error) {
                                                                    // Можно добавить обработку ошибки
                                                                }
                                                            }}
                                                        />
                                                        <span className="font-gilroy_semibold text-[#0D062D] text-[12px] leading-[100%] mb-1">
                                                            {typeof subtask === 'object' ? subtask.title : subtask}
                                                        </span>
                                                    </div>
                                                ))}
                                                {task.subtasks.length > 3 && (
                                                    <div className="flex items-left justify-left text-[#0D062D] text-opacity-50 text-lg">...</div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center mt-2">
                                            {task.deadline && (
                                                <div className="bg-[#FFA500] text-white px-2 py-1 rounded text-[12px] w-[80px] h-[23px] flex items-center justify-center">
                                                    {new Date(task.deadline).toLocaleString('ru-RU', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false
                                                    }).replace(',', '')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {tasks.filter(task => task.status === 1 && String(task.executor) === String(viewedProfileId)).length === 0 && (
                                    <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                                )}
                            </div>
                        </div>

                        {/* Колонка "Завершено" */}
                        <div className="bg-[#F4F4F4] p-[10px] rounded-lg flex flex-col h-full overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-[#40D033] h-[11px] w-[11px] rounded-full flex-shrink-0"/>
                                <h3 className="font-gilroy_semibold text-[#0D062D] text-[27px]">Завершено</h3>
                            </div>
                            <div className="overflow-y-auto flex-1 pr-2">
                                {tasks
                                    .filter(task => task.status === 3 && String(task.executor) === String(viewedProfileId))
                                    .map((task, index) => (
                                        <div
                                            key={task.id}
                                            className="flex flex-col bg-white p-3 rounded-xl mb-3"
                                        >
                                            <Link to={`/event?id=${task.event}`} className="block mb-2">
                                                <h3 className="font-gilroy_semibold text-[#0D062D] text-[14px] leading-[100%] hover:underline">
                                            {task.title || task.t || 'Без названия'}
                                        </h3>
                                            </Link>
                                            <div className="cursor-pointer" onClick={() => handleEditTask(task)}>
                                                <span className="text-[#0D062D] text-opacity-50 text-sm transition-all duration-200 hover:text-green-600 hover:underline cursor-pointer">Редактировать</span>
                                            </div>
                                        {task.subtasks && task.subtasks.length > 0 && (
                                            <div className="mb-2">
                                                {task.subtasks.slice(0, 3).map((subtask, index) => (
                                                    <div key={index} className="flex items-center gap-2 mb-1">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-[#0D062D]"
                                                            checked={typeof subtask === 'object' ? subtask.status === 3 : false}
                                                            onChange={async (e) => {
                                                                try {
                                                                    const newStatus = e.target.checked ? 3 : 2;
                                                                    // Формируем сокращённый объект задачи
                                                                    const taskObject = {
                                                                        t: task.title || task.t || '',
                                                                        d: task.description || task.d || '',
                                                                        dl: (task.deadlineTime ? `${task.deadline}T${task.deadlineTime}` : task.deadline) || task.dl || null,
                                                                        s: task.status || task.s || 2,
                                                                        e: task.executor || task.e || null,
                                                                        ev: task.event || task.ev || null,
                                                                        st: task.subtasks.map((st, i) => ({
                                                                            t: (typeof st === 'object' ? st.title : st) || '',
                                                                            s: i === index ? newStatus : (typeof st === 'object' ? st.status : 2)
                                                                        }))
                                                                    };
                                                                    const taskData = {
                                                                        task: JSON.stringify(taskObject),
                                                                        event: task.event || task.ev || '',
                                                                        executor: task.executor || task.e || null
                                                                    };
                                                                    await axios.put(`${BASE_URL}/api/tasks/${task.id}/`, taskData, {
                                                                        headers: {
                                                                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                                                            'Content-Type': 'application/json'
                                                                        }
                                                                    });
                                                                    // Обновляем только локальное состояние
                                                                    setTasks(prevTasks => prevTasks.map(t => {
                                                                        if (t.id === task.id) {
                                                                            const updatedSubtasks = t.subtasks.map((st, i) =>
                                                                                i === index ? { ...st, status: newStatus } : st
                                                                            );
                                                                            return { ...t, subtasks: updatedSubtasks };
                                                                        }
                                                                        return t;
                                                                    }));
                                                                } catch (error) {
                                                                    // Можно добавить обработку ошибки
                                                                }
                                                            }}
                                                        />
                                                        <span className="font-gilroy_semibold text-[#0D062D] text-[12px] leading-[100%] mb-1">
                                                            {typeof subtask === 'object' ? subtask.title : subtask}
                                                        </span>
                                                    </div>
                                                ))}
                                                {task.subtasks.length > 3 && (
                                                    <div className="flex items-left justify-left text-[#0D062D] text-opacity-50 text-lg">...</div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center mt-2">
                                            {task.deadline && (
                                                <div className="bg-[#FFA500] text-white px-2 py-1 rounded text-[12px] w-[80px] h-[23px] flex items-center justify-center">
                                                    {new Date(task.deadline).toLocaleString('ru-RU', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false
                                                    }).replace(',', '')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {tasks.filter(task => task.status === 3 && String(task.executor) === String(viewedProfileId)).length === 0 && (
                                    <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Модальное окно редактирования задачи */}
            <Modal
                isOpen={editTaskModalIsOpen}
                onRequestClose={() => setEditTaskModalIsOpen(false)}
                style={{
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                    },
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                        width: '500px',
                        padding: '20px',
                        borderRadius: '15px'
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
                            value={newTask.assignee}
                            onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                        >
                            <option value="">Выберите ответственного</option>
                            {Object.values(users).map((user) => (
                                <option key={`assignee-${user.id}`} value={user.id.toString()}>
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
        </div>
    );
};

export default Profile;