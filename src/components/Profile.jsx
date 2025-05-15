import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import avatar_placeholder from "../photos/avatar_placeholder.png";
import { BASE_URL } from "./Globals";
import { Link } from "react-router-dom";

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

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
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
                        user_id: viewedProfileId // Параметр для фильтрации задач по пользователю
                    },
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                setProfileData(response.data.profile);
                setEvents(response.data.events || []);
                setTasks(tasksResponse.data || []);
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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProfileData({...profileData, profile_photo: e.target.files[0]});
        }
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
            {currentUserAccessLevel >= 2 && (
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
                ): (
                    tasks.length > 0 ? (
                        <div className="grid grid-cols-3 gap-[23px]">
                            {/* Колонка "Не начато" */}
                            <div className="bg-[#F4F4F4] p-[10px] rounded-lg w-[287px]">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-[#FF7D56] h-[11px] w-[11px] rounded-full flex-shrink-0"/>
                                    <h3 className="font-gilroy_semibold text-[#0D062D] text-[27px]">Не начато</h3>
                                </div>
                                {tasks
                                    .filter(task => task.status === 2)
                                    .map(task => (
                                    <div key={task.id} className="flex flex-col bg-[#E2F7E2] p-3 rounded-xl mb-3 h-[150px]">
                                        <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-2">
                                        {task.title || 'Без названия'}
                                        </h3>
                                        <p className="text-[#0D062D] text-opacity-70 text-[14px] flex-grow overflow-hidden break-words">
                                        <span className="line-clamp-2">
                                            {task.description || 'Описание отсутствует'}
                                        </span>
                                        </p>
                                        <div className="flex justify-between items-center mt-2">
                                        {task.deadline && (
                                            <p className="text-[#0D062D] text-opacity-50 text-xs">
                                            {new Date(task.deadline).toLocaleDateString()}
                                            </p>
                                        )}
                                        </div>
                                    </div>
                                    ))}
                                {tasks.filter(task => task.status === 2).length === 0 && (
                                    <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                                )}
                            </div>

                            {/* Колонка "В работе" */}
                            <div className="bg-[#F4F4F4] p-[10px] rounded-lg w-[287px]">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-[#FFDF56] h-[11px] w-[11px] rounded-full flex-shrink-0"/>
                                    <h3 className="font-gilroy_semibold text-[#0D062D] text-[27px]">В работе</h3>
                                </div>
                            {tasks
                                .filter(task => task.status === 1)
                                .map(task => (
                                <div key={task.id} className="flex flex-col bg-[#E2F7E2] p-3 rounded-xl mb-3 h-[150px]">
                                    <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-2">
                                    {task.title || 'Без названия'}
                                    </h3>
                                    <p className="text-[#0D062D] text-opacity-70 text-[14px] flex-grow overflow-hidden break-words">
                                    <span className="line-clamp-2">
                                        {task.description || 'Описание отсутствует'}
                                    </span>
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                        В работе
                                    </span>
                                    {task.deadline && (
                                        <p className="text-[#0D062D] text-opacity-50 text-xs">
                                        {new Date(task.deadline).toLocaleDateString()}
                                        </p>
                                    )}
                                    </div>
                                </div>
                                ))}
                            {tasks.filter(task => task.status === 1).length === 0 && (
                                <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                            )}
                            </div>

                            {/* Колонка "Завершено" */}
                            <div className="bg-[#F4F4F4] p-[10px] rounded-lg w-[287px]">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-[#40D033] h-[11px] w-[11px] rounded-full flex-shrink-0"/>
                                    <h3 className="font-gilroy_semibold text-[#0D062D] text-[27px]">Завершено</h3>
                                </div>
                            {tasks
                                .filter(task => task.status === 3)
                                .map(task => (
                                <div key={task.id} className="flex flex-col bg-[#E2F7E2] p-3 rounded-xl mb-3 h-[150px]">
                                    <h3 className="font-gilroy_semibold text-[#0D062D] text-xl mb-2">
                                    {task.title || 'Без названия'}
                                    </h3>
                                    <p className="text-[#0D062D] text-opacity-70 text-[14px] flex-grow overflow-hidden break-words">
                                    <span className="line-clamp-2">
                                        {task.description || 'Описание отсутствует'}
                                    </span>
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                        Завершено
                                    </span>
                                    {task.deadline && (
                                        <p className="text-[#0D062D] text-opacity-50 text-xs">
                                        {new Date(task.deadline).toLocaleDateString()}
                                        </p>
                                    )}
                                    </div>
                                </div>
                                ))}
                            {tasks.filter(task => task.status === 3).length === 0 && (
                                <p className="text-[#0D062D] text-opacity-30 text-sm">Нет задач</p>
                            )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-[#0D062D] text-opacity-50">
                            {isOwnProfile 
                                ? 'У вас пока нет задач' 
                                : 'У пользователя нет задач'}
                        </p>
                    )
                )}
            </div>
            
        )} </div>
    )}

export default Profile;