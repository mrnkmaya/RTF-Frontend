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

const MiniCalendar = ({ tasks, events, profileId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
//   // Добавляем эффект для проверки смены дня
//   useEffect(() => {
//     const checkDateChange = () => {
//       const now = new Date();
//       if (now.getDate() !== currentDate.getDate()) {
//         setCurrentDate(now);
//       }
//     };
    
//     // Проверяем каждую минуту
//     const intervalId = setInterval(checkDateChange, 60000);
    
//     return () => clearInterval(intervalId);
//   }, [currentDate]);

  
  // Форматируем дату для сравнения (YYYY-MM-DD)
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Получаем задачи на текущий день
  const getTasksForDate = () => {
    return tasks.filter(task => {
      try {
        if (!task.deadline) return false;
        
        // Проверяем дату
        const taskDate = new Date(task.deadline);
        if (formatDate(taskDate) !== formatDate(currentDate)) return false;
        
        // Проверяем исполнителей (аналогично основной логике)
        const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
        const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
        const executorsIds = executors.map(id => parseInt(id));
        
        return executorsIds.includes(parseInt(profileId));
      } catch (error) {
        console.error('Error processing task:', task, error);
        return false;
      }
    });
  };
  
  // Получаем мероприятия на текущий день
  const getEventsForDate = () => {
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return formatDate(eventDate) === formatDate(currentDate);
    });
  };
  
  const dayTasks = getTasksForDate();
  const dayEvents = getEventsForDate();
  
  return (
    <div className="bg-white p-2 rounded-xl w-full">
      
      <div className="space-y-3">
        {dayTasks.length > 0 && (
          <div>
            <h4 className="font-gilroy_semibold text-[#0D062D] text-sm mb-2">Задачи</h4>
        {dayTasks.map(task => {
        // Получаем название задачи (аналогично основной логике)
        const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
        const taskTitle = taskDetails.t || taskDetails.title || 'Без названия';
        const taskStatus = taskDetails.s || taskDetails.status || 2;
        const eventId = taskDetails.ev || task.event; // Получаем ID связанного мероприятия
        const taskTime = task.deadline ? 
            new Date(task.deadline).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }) : '--:--';
            
        return (
            <Link 
            key={`task-${task.id}`} 
            to={`/event?id=${eventId}`} // Ссылка на мероприятие, к которому относится задача
            className="flex items-center justify-between p-2 bg-[#DFA87433] rounded-lg hover:bg-[#e0e0e0] transition-colors w-full"
            >
                <span className="text-xl text-[#DFA874] w-10">
                    {taskTime}
                </span>
            <span className="text-xl  truncate max-w-[150px]">{taskTitle}</span>
            </Link>
        );
        })}
          </div>
        )}
        
        {dayEvents.length > 0 && (
          <div>
            <h4 className="font-gilroy_semibold text-[#0D062D] text-sm mb-2">Мероприятия</h4>
            {dayEvents.map(event => (
              <Link 
                key={`event-${event.id}`} 
                to={`/event?id=${event.id}`}
                className="flex items-center gap-2 p-2 bg-[#CCE8FF] rounded-lg hover:bg-[#b3d9ff] mb-2"
              >
                <span className="text-xl truncate max-w-[150px]">{event.title}</span>
              </Link>
            ))}
          </div>
        )}
        
        {dayTasks.length === 0 && dayEvents.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            На выбранный день нет задач и мероприятий
          </p>
        )}
      </div>
    </div>
  );
};

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
        assignees: [],
        subtasks: []
    });
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const accessLevel = localStorage.getItem('access_level');
    const [subtasksModalIsOpen, setSubtasksModalIsOpen] = useState(false);
    const [selectedTaskForSubtasks, setSelectedTaskForSubtasks] = useState(null);

    const updateSubtaskStatus = async (taskId, subtaskIndex, newStatus) => {
        try {
            // Получаем текущую задачу
            const currentTask = tasks.find(t => t.id === taskId);
            if (!currentTask) return;

            // Парсим текущие данные задачи
            let taskDetails;
            try {
                taskDetails = typeof currentTask.task === 'string' 
                    ? JSON.parse(currentTask.task) 
                    : currentTask;
            } catch (error) {
                console.error('Ошибка при парсинге задачи:', error);
                return;
            }

            // Получаем текущие подзадачи
            const currentSubtasks = taskDetails.st || taskDetails.subtasks || [];
            
            // Обновляем подзадачи, сохраняя их структуру
            const updatedSubtasks = currentSubtasks.map((st, idx) => {
                if (idx === subtaskIndex) {
                    // Если подзадача - строка, преобразуем её в объект
                    if (typeof st === 'string') {
                        return { t: String(st), s: newStatus };
                    }
                    // Если подзадача - объект, обновляем только статус
                    return {
                        t: String(st.t || st.title || ''),
                        s: newStatus
                    };
                }
                // Для остальных подзадач сохраняем текущую структуру
                if (typeof st === 'string') {
                    return { t: String(st), s: st.s || 2 };
                }
                return {
                    t: String(st.t || st.title || ''),
                    s: st.s || st.status || 2
                };
            });

            // Формируем обновленный объект задачи
            const updatedTaskDetails = {
                ...taskDetails,
                st: updatedSubtasks
            };

            // Отправляем обновление на сервер
            const taskData = {
                task: JSON.stringify(updatedTaskDetails),
                event: taskDetails.ev || currentTask.event,
                executor: taskDetails.e || currentTask.executor
            };

            const response = await axios.put(
                `${BASE_URL}/api/tasks/${taskId}/`,
                taskData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Обновляем локальное состояние
            setTasks(prevTasks => 
                prevTasks.map(t => {
                    if (t.id === taskId) {
                        const parsedTask = JSON.parse(response.data.task);
                        const processedSubtasks = (parsedTask.st || []).map(st => ({
                            title: typeof st === 'string' ? String(st) : String(st.t || st.title || ''),
                            status: typeof st === 'string' ? 2 : (st.s || st.status || 2)
                        }));
                        
                        return {
                            ...t,
                            task: response.data.task,
                            subtasks: processedSubtasks
                        };
                    }
                    return t;
                })
            );

            // Обновляем состояние выбранной задачи для модального окна
            if (selectedTaskForSubtasks && selectedTaskForSubtasks.id === taskId) {
                setSelectedTaskForSubtasks(prev => {
                    if (!prev) return null;
                    const updatedSubtasks = [...prev.subtasks];
                    updatedSubtasks[subtaskIndex] = {
                        ...updatedSubtasks[subtaskIndex],
                        status: newStatus
                    };
                    return {
                        ...prev,
                        subtasks: updatedSubtasks
                    };
                });
            }

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
        // 3 уровень может редактировать всё
        if (currentUserAccessLevel === 3) return true;
        // 1 и 2 уровень могут редактировать только свой профиль
        return isOwnProfile;
    };

    const getEditableFields = () => {
        // Для 3 уровня
        if (currentUserAccessLevel === 3) {
            if (isOwnProfile) {
                // Для своего профиля можно редактировать всё
                return {
                    commission: true,
                    status: true,
                    date_of_birth: true,
                    number_phone: true,
                    email: true,
                    adress: true
                };
            } else {
                // Для чужих профилей только должность и комиссию
                return {
                    commission: true,
                    status: true,
                    date_of_birth: false,
                    number_phone: false,
                    email: false,
                    adress: false
                };
            }
        }
        //ss
        // Для 1 и 2 уровня только свои данные, кроме должности и комиссии
        return {
            commission: false,
            status: false,
            date_of_birth: isOwnProfile,
            number_phone: isOwnProfile,
            email: isOwnProfile,
            adress: isOwnProfile
        };
    };

    const editableFields = getEditableFields();

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/tasks/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            const processedTasks = response.data.map(task => {
                try {
                    const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;

                    // Проверяем, является ли пользователь исполнителем
                    const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                    const executorsIds = executors.map(id => parseInt(id));
                    const isExecutor = executorsIds.includes(parseInt(viewedProfileId));

                    // Не показываем задачи из архивных мероприятий
                    if (!isExecutor || task.is_past) {
                        return null;
                    }

                    // Обрабатываем подзадачи
                    const subtasks = (taskDetails.st || taskDetails.subtasks || []).map(st => {
                        if (typeof st === 'string') {
                            return { title: st, status: 2 };
                        }
                        return {
                            title: st.t || st.title || '',
                            status: st.s || st.status || 2
                        };
                    });

                    return {
                        id: task.id,
                        title: taskDetails.t || taskDetails.title || 'Без названия',
                        description: taskDetails.d || taskDetails.description || '',
                        deadline: taskDetails.dl || taskDetails.deadline || null,
                        status: taskDetails.s || taskDetails.status || task.status || 2,
                        executor: taskDetails.e || taskDetails.executor || null,
                        event: taskDetails.ev || taskDetails.event || null,
                        subtasks: subtasks,
                        task: task.task
                    };
                } catch (error) {
                    console.error('Error processing task:', error);
                    return null;
                }
            }).filter(Boolean);

            console.log('Processed tasks:', processedTasks);
            setTasks(processedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

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

                // Получаем все задачи
                await fetchTasks();

                setProfileData(response.data.profile);
                setEvents(response.data.events || []);
            } catch (error) {
                console.error("Error loading data:", error);
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

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const endpoint = isOwnProfile 
                ? `${BASE_URL}/api/profile/${viewedProfileId}/`
                : `${BASE_URL}/api/profile_view/${viewedProfileId}/`;
            
            const payload = {
                status: profileData.status || null,
                commission: profileData.commission === '' ? '' : profileData.commission || null,
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
                    executor: taskDetails.e || [],
                    event: taskDetails.ev || '',
                    subtasks: (taskDetails.st || taskDetails.subtasks || []).map(st => ({
                        title: st.t || st.title || '',
                        status: st.s || st.status || 2
                    }))
                };
            } else {
                taskDetails = {
                    ...taskDetails,
                    subtasks: (taskDetails.st || taskDetails.subtasks || []).map(st => ({
                        title: st.t || st.title || '',
                        status: st.s || st.status || 2
                    }))
                };
            }
            // Преобразуем исполнителей в массив
            const executors = Array.isArray(taskDetails.executor) 
                ? taskDetails.executor 
                : [taskDetails.executor].filter(Boolean);

            setSelectedTask(task);
            setNewTask({
                title: taskDetails?.title || '',
                description: taskDetails?.description || '',
                deadline: taskDetails?.deadline || '',
                deadlineTime: '',
                status: taskDetails?.status || 2,
                assignees: executors.map(e => e.toString()),
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
                assignees: [],
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
                e: newTask.assignees,
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
                executor: newTask.assignees
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
        console.log('12. Rendering tasks:', tasks);
        
        const notStartedTasks = tasks.filter(task => task.status === 2);
        const inProgressTasks = tasks.filter(task => task.status === 1);
        const completedTasks = tasks.filter(task => task.status === 3);

        console.log('13. Filtered tasks by status:', {
            notStarted: notStartedTasks,
            inProgress: inProgressTasks,
            completed: completedTasks
        });

        return (
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-4">Не начато</h3>
                    <div className="space-y-3">
                        {notStartedTasks.map((task) => (
                            <Link
                                key={task.id}
                                to={`/event?id=${task.event}`}
                                className="block bg-[#F4F4F4] p-3 rounded-lg"
                            >
                                <h4 className="font-gilroy_semibold text-[#0D062D]">{task.title}</h4>
                                <p className="text-[#0D062D] text-opacity-50 text-sm mt-1">{task.description}</p>
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="mt-2">
                                        {task.subtasks.slice(0, 3).map((subtask, index) => (
                                            <div key={index} className="flex items-center gap-2 mb-1">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-[#0D062D]"
                                                    checked={subtask.status === 3}
                                                    onChange={async (e) => {
                                                        try {
                                                            const newStatus = e.target.checked ? 3 : 2;
                                                            await updateSubtaskStatus(task.id, index, newStatus);
                                                        } catch (error) {
                                                            console.error('Ошибка при обновлении статуса подзадачи:', error);
                                                        }
                                                    }}
                                                />
                                                <span className="font-gilroy_semibold text-[#0D062D] text-[12px] leading-[100%] mb-1">
                                                    {subtask.title}
                                                </span>
                                            </div>
                                        ))}
                                        {task.subtasks.length > 3 && (
                                            <div className="flex items-left justify-left text-[#0D062D] text-opacity-50 text-lg">...</div>
                                        )}
                                    </div>
                                )}
                                {task.deadline && (
                                    <p className="text-[#0D062D] text-opacity-50 text-xs mt-2">
                                        Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                                    </p>
                                )}
                            </Link>
                        ))}
                        {notStartedTasks.length === 0 && (
                            <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-4">В процессе</h3>
                    <div className="space-y-3">
                        {inProgressTasks.map((task) => (
                            <Link
                                key={task.id}
                                to={`/event?id=${task.event}`}
                                className="block bg-[#F4F4F4] p-3 rounded-lg"
                            >
                                <h4 className="font-gilroy_semibold text-[#0D062D]">{task.title}</h4>
                                <p className="text-[#0D062D] text-opacity-50 text-sm mt-1">{task.description}</p>
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="mt-2">
                                        {task.subtasks.slice(0, 3).map((subtask, index) => (
                                            <div key={index} className="flex items-center gap-2 mb-1">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-[#0D062D]"
                                                    checked={subtask.status === 3}
                                                    onChange={async (e) => {
                                                        try {
                                                            const newStatus = e.target.checked ? 3 : 2;
                                                            await updateSubtaskStatus(task.id, index, newStatus);
                                                        } catch (error) {
                                                            console.error('Ошибка при обновлении статуса подзадачи:', error);
                                                        }
                                                    }}
                                                />
                                                <span className="font-gilroy_semibold text-[#0D062D] text-[12px] leading-[100%] mb-1">
                                                    {subtask.title}
                                                </span>
                                            </div>
                                        ))}
                                        {task.subtasks.length > 3 && (
                                            <div className="flex items-left justify-left text-[#0D062D] text-opacity-50 text-lg">...</div>
                                        )}
                                    </div>
                                )}
                                {task.deadline && (
                                    <p className="text-[#0D062D] text-opacity-50 text-xs mt-2">
                                        Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                                    </p>
                                )}
                            </Link>
                        ))}
                        {tasks.filter(task => {
                            const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                            const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                            const executorsIds = executors.map(id => parseInt(id));
                            return task.status === 1 && executorsIds.includes(parseInt(viewedProfileId));
                        }).length === 0 && (
                            <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-4">Завершено</h3>
                    <div className="space-y-3">
                        {completedTasks.map((task) => (
                            <Link
                                key={task.id}
                                to={`/event?id=${task.event}`}
                                className="block bg-[#F4F4F4] p-3 rounded-lg"
                            >
                                <h4 className="font-gilroy_semibold text-[#0D062D]">{task.title}</h4>
                                <p className="text-[#0D062D] text-opacity-50 text-sm mt-1">{task.description}</p>
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="mt-2">
                                        {task.subtasks.slice(0, 3).map((subtask, index) => (
                                            <div key={index} className="flex items-center gap-2 mb-1">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-[#0D062D]"
                                                    checked={subtask.status === 3}
                                                    onChange={async (e) => {
                                                        try {
                                                            const newStatus = e.target.checked ? 3 : 2;
                                                            await updateSubtaskStatus(task.id, index, newStatus);
                                                        } catch (error) {
                                                            console.error('Ошибка при обновлении статуса подзадачи:', error);
                                                        }
                                                    }}
                                                />
                                                <span className="font-gilroy_semibold text-[#0D062D] text-[12px] leading-[100%] mb-1">
                                                    {subtask.title}
                                                </span>
                                            </div>
                                        ))}
                                        {task.subtasks.length > 3 && (
                                            <div className="flex items-left justify-left text-[#0D062D] text-opacity-50 text-lg">...</div>
                                        )}
                                    </div>
                                )}
                                {task.deadline && (
                                    <p className="text-[#0D062D] text-opacity-50 text-xs mt-2">
                                        Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                                    </p>
                                )}
                            </Link>
                        ))}
                        {tasks.filter(task => {
                            const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                            const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                            const executorsIds = executors.map(id => parseInt(id));
                            return task.status === 3 && executorsIds.includes(parseInt(viewedProfileId));
                        }).length === 0 && (
                            <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                        )}
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
                        <>
                            <button
                                className={`${BUTTON_STYLE} ${isLoading ? 'opacity-50' : ''}`}
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Редактировать'}
                            </button>
                            {accessLevel === '3' && (
                                <button 
                                    className={`${BUTTON_STYLE} ml-4 bg-[#FF4B4B]`}
                                    onClick={() => window.location.href = '/admin'}
                                >
                                    Админ-панель
                                </button>
                            )}
                            <button
                                className={`${BUTTON_STYLE} ml-4 bg-[#FF4B4B]`}
                                onClick={() => setLogoutModalOpen(true)}
                            >
                                Выйти
                            </button>
                        </>
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
                                    <option value="Социально-правовая">Социально-правовая</option>
                                    <option value="Информационная">Информационная</option>
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
                <div className="flex gap-6">
                    <div className="w-[303px] h-auto bg-[#FFFFFF] rounded-3xl p-6 mb-6">
                    <div className="flex items-center mb-3">
                        <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                        <h1 className="font-gilroy_semibold text-[#0D062D] text-[32px] mr-auto leading-[38px]">
                        {new Date().toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long' 
                        })}
                        </h1>
                    </div>
                
                    <MiniCalendar 
                        tasks={tasks} 
                        events={events} 
                        profileId={viewedProfileId} 
                    />
            </div>
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
                                    .filter(task => {
                                        const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                                        const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                                        const executorsIds = executors.map(id => parseInt(id));
                                        return task.status === 2 && executorsIds.includes(parseInt(viewedProfileId));
                                    })
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
                                                    <ul className="list-disc list-inside mt-1">
                                                        {task.subtasks.slice(0, 3).map((subtask, subIndex) => {
                                                            const subtaskTitle = typeof subtask === 'string' ? subtask : (subtask?.title || '');
                                                            const subtaskStatus = typeof subtask === 'string' ? 2 : (subtask?.status || subtask?.s || 2);
                                                            return (
                                                                <li key={`subtask-${task.id}-${subIndex}`} className="flex items-center gap-2 mb-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-4 h-4 rounded border-[#0D062D]"
                                                                        checked={subtaskStatus === 3}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            const newStatus = e.target.checked ? 3 : 2;
                                                                            updateSubtaskStatus(task.id, subIndex, newStatus);
                                                                        }}
                                                                    />
                                                                    <span className="text-[#0D062D] text-sm">
                                                                        {subtaskTitle}
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                        {task.subtasks.length > 3 && (
                                                            <li 
                                                                className="flex items-center text-[#0077EB] text-sm cursor-pointer hover:underline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedTaskForSubtasks({
                                                                        id: task.id,
                                                                        title: task.title,
                                                                        subtasks: task.subtasks
                                                                    });
                                                                    setSubtasksModalIsOpen(true);
                                                                }}
                                                            >
                                                                Показать все подзадачи ({task.subtasks.length})
                                                            </li>
                                                        )}
                                                    </ul>
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
                                {tasks.filter(task => {
                                    const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                                    const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                                    const executorsIds = executors.map(id => parseInt(id));
                                    return task.status === 2 && executorsIds.includes(parseInt(viewedProfileId));
                                }).length === 0 && (
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
                                    .filter(task => {
                                        const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                                        const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                                        const executorsIds = executors.map(id => parseInt(id));
                                        return task.status === 1 && executorsIds.includes(parseInt(viewedProfileId));
                                    })
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
                                                <ul className="list-disc list-inside mt-1">
                                                    {task.subtasks.slice(0, 3).map((subtask, subIndex) => {
                                                        const subtaskTitle = typeof subtask === 'string' ? subtask : (subtask?.title || '');
                                                        const subtaskStatus = typeof subtask === 'string' ? 2 : (subtask?.status || subtask?.s || 2);
                                                        return (
                                                            <li key={`subtask-${task.id}-${subIndex}`} className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded border-[#0D062D]"
                                                                    checked={subtaskStatus === 3}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        const newStatus = e.target.checked ? 3 : 2;
                                                                        updateSubtaskStatus(task.id, subIndex, newStatus);
                                                                    }}
                                                                />
                                                                <span className="text-[#0D062D] text-sm">
                                                                    {subtaskTitle}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                    {task.subtasks.length > 3 && (
                                                        <li 
                                                            className="flex items-center text-[#0077EB] text-sm cursor-pointer hover:underline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTaskForSubtasks({
                                                                    id: task.id,
                                                                    title: task.title,
                                                                    subtasks: task.subtasks
                                                                });
                                                                setSubtasksModalIsOpen(true);
                                                            }}
                                                        >
                                                            Показать все подзадачи ({task.subtasks.length})
                                                        </li>
                                                    )}
                                                </ul>
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
                                {tasks.filter(task => {
                                    const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                                    const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                                    const executorsIds = executors.map(id => parseInt(id));
                                    return task.status === 2 && executorsIds.includes(parseInt(viewedProfileId));
                                }).length === 0 && (
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
                                    .filter(task => {
                                        const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                                        const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                                        const executorsIds = executors.map(id => parseInt(id));
                                        return task.status === 3 && executorsIds.includes(parseInt(viewedProfileId));
                                    })
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
                                                <ul className="list-disc list-inside mt-1">
                                                    {task.subtasks.slice(0, 3).map((subtask, subIndex) => {
                                                        const subtaskTitle = typeof subtask === 'string' ? subtask : (subtask?.title || '');
                                                        const subtaskStatus = typeof subtask === 'string' ? 2 : (subtask?.status || subtask?.s || 2);
                                                        return (
                                                            <li key={`subtask-${task.id}-${subIndex}`} className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded border-[#0D062D]"
                                                                    checked={subtaskStatus === 3}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        const newStatus = e.target.checked ? 3 : 2;
                                                                        updateSubtaskStatus(task.id, subIndex, newStatus);
                                                                    }}
                                                                />
                                                                <span className="text-[#0D062D] text-sm">
                                                                    {subtaskTitle}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                    {task.subtasks.length > 3 && (
                                                        <li 
                                                            className="flex items-center text-[#0077EB] text-sm cursor-pointer hover:underline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTaskForSubtasks({
                                                                    id: task.id,
                                                                    title: task.title,
                                                                    subtasks: task.subtasks
                                                                });
                                                                setSubtasksModalIsOpen(true);
                                                            }}
                                                        >
                                                            Показать все подзадачи ({task.subtasks.length})
                                                        </li>
                                                    )}
                                                </ul>
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
                                {tasks.filter(task => {
                                    const taskDetails = typeof task.task === 'string' ? JSON.parse(task.task) : task;
                                    const executors = Array.isArray(taskDetails.e) ? taskDetails.e : [taskDetails.e].filter(Boolean);
                                    const executorsIds = executors.map(id => parseInt(id));
                                    return task.status === 3 && executorsIds.includes(parseInt(viewedProfileId));
                                }).length === 0 && (
                                    <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
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
                        <label className="font-gilroy_semibold text-[#0D062D] text-[16px]">Исполнители</label>
                        <select
                            multiple
                            className="bg-[#F1F4F9] rounded-lg p-2 h-[120px]"
                            value={newTask.assignees}
                            onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                setNewTask({...newTask, assignees: selectedOptions});
                            }}
                        >
                            {Object.values(users).map((user) => (
                                <option key={`assignee-${user.id}`} value={user.id.toString()}>
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                        <span className="text-sm text-gray-500">Удерживайте Ctrl для выбора нескольких исполнителей</span>
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

            {/* Модальное окно выхода */}
            <Modal
                isOpen={logoutModalOpen}
                onRequestClose={() => setLogoutModalOpen(false)}
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
                        width: '350px',
                        padding: '24px',
                        borderRadius: '15px',
                        textAlign: 'center'
                    }
                }}
            >
                <h2 className="text-xl font-gilroy_bold mb-4">Вы точно хотите выйти?</h2>
                <div className="flex justify-center gap-4 mt-4">
                    <button
                        className="bg-[#F1F4F9] text-[#0D062D] px-6 py-2 rounded-xl"
                        onClick={() => setLogoutModalOpen(false)}
                    >
                        Отмена
                    </button>
                    <button
                        className='bg-[#FF4B4B] text-white p-[7px] rounded-lg'
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/';
                        }}
                    >
                        Выйти
                    </button>
                </div>
            </Modal>

            {/* Модальное окно для подзадач */}
            <Modal
                isOpen={subtasksModalIsOpen}
                onRequestClose={() => {
                    setSubtasksModalIsOpen(false);
                    setSelectedTaskForSubtasks(null);
                }}
                style={{
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#FFFFFF',
                        width: '500px',
                        height: 'auto',
                        maxHeight: '80vh',
                        borderRadius: '24px',
                        padding: '24px',
                        border: 'none',
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
                    }
                }}
            >
                <div className="flex flex-col gap-4">
                    <h2 className="font-gilroy_bold text-[#0D062D] text-[24px] leading-[30px]">
                        Подзадачи: {selectedTaskForSubtasks?.title || ''}
                    </h2>
                    <div className="w-full max-h-[400px] overflow-y-auto">
                        <ul className="flex flex-col gap-2">
                            {selectedTaskForSubtasks?.subtasks?.map((subtask, index) => {
                                const subtaskTitle = typeof subtask === 'string' ? subtask : (subtask?.title || '');
                                const subtaskStatus = typeof subtask === 'string' ? 2 : (subtask?.status || subtask?.s || 2);
                                return (
                                    <li key={`modal-subtask-${index}`} className="flex items-center gap-2 p-2 bg-[#F1F4F9] rounded-lg">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-[#0D062D]"
                                            checked={subtaskStatus === 3}
                                            onChange={(e) => {
                                                const newStatus = e.target.checked ? 3 : 2;
                                                updateSubtaskStatus(selectedTaskForSubtasks.id, index, newStatus);
                                            }}
                                        />
                                        <span className="text-[#0D062D] text-sm flex-1">
                                            {subtaskTitle}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            className="bg-[#F1F4F9] text-[#0D062D] px-6 py-2 rounded-xl hover:bg-[#E0E0E0] transition-colors"
                            onClick={() => {
                                setSubtasksModalIsOpen(false);
                                setSelectedTaskForSubtasks(null);
                            }}
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Profile;