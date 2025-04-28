import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import avatar_placeholder from "../photos/avatar_placeholder.png";
import { BASE_URL } from "./Globals";

const H3_STYLE = 'font-gilroy_semibold text-white opacity-50 text-[16px] leading-[19px] mb-[6px]';
const DATA_STYLE = 'font-gilroy_semibold text-white text-[24px] leading-[17px]';
const BUTTON_STYLE = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const INPUT_FIELD_STYLE = "w-[400px] h-[40px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8]";

const checkPlaceholder = (data) => data || 'Не указано';

const Profile = () => {
    const [profileData, setProfileData] = useState({});
    const [events, setEvents] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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
            navigate('/team'); // Перенаправляем на страницу команды
            return;
        }
    }, [currentUserAccessLevel, isOwnProfile, navigate]);

    // Определяем, может ли пользователь редактировать профиль
    const canEdit = () => {
        if (isOwnProfile) return true; // Свой профиль можно редактировать
        if (currentUserAccessLevel >= 3) return true; // 3+ уровень может редактировать
        return false;
    };

    // Определяем, какие поля можно редактировать
    const getEditableFields = () => {
        if (isOwnProfile) {
            return {
                commission: true,
                date_of_birth: true,
                number_phone: true,
                email: true
            };
        }
        if (currentUserAccessLevel >= 3) {
            return {
                commission: true,
                date_of_birth: false,
                number_phone: false,
                email: false
            };
        }
        return {
            commission: false,
            date_of_birth: false,
            number_phone: false,
            email: false
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
                
                setProfileData(response.data.profile);
                setEvents(response.data.events || []);
            } catch (error) {
                console.error("Ошибка загрузки данных:", error);
                if (error.response?.status === 403) {
                    navigate('/team'); // Если нет прав на просмотр
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
            
            // Формируем данные для отправки в зависимости от прав
            const updateData = {};
            if (editableFields.commission) updateData.commission = profileData.commission;
            if (isOwnProfile) {
                updateData.date_of_birth = profileData.date_of_birth;
                updateData.number_phone = profileData.number_phone;
                updateData.email = profileData.email;
            }
    
            await axios.put(
                endpoint,
                updateData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            setIsEditing(false);
            // Обновляем данные
            const { data } = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            setProfileData(data.profile);
        } catch (error) {
            console.error("Ошибка сохранения:", error.response?.data || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-[#71798C] w-screen h-screen flex items-center justify-center">
                <div className="text-white text-2xl">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="bg-[#71798C] w-screen h-auto p-6">
            <div className="w-[1283px] h-auto bg-[#292C33] rounded-3xl p-6 mb-6">
                <div className="flex items-center mb-3">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className="font-gilroy_semibold text-white text-[32px] mr-auto leading-[38px]">
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
                    <img
                        src={profileData.profile_photo 
                            ? `${BASE_URL}${profileData.profile_photo}`
                            : avatar_placeholder}
                        width="185"
                        height="185"
                        alt="Фото профиля"
                        className="rounded-[50%] object-cover"
                    />
                    
                    <div className="flex flex-col">
                        <h2 className="font-gilroy_semibold text-white text-[32px] leading-[38px] mb-6">
                            {checkPlaceholder(profileData.full_name)}
                        </h2>
                        
                        <div className="flex flex-row gap-6 mb-6">
                            <div>
                                <h3 className={H3_STYLE}>Комиссия</h3>
                                {isEditing && editableFields.commission ? (
                                    <input
                                        className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`}
                                        value={profileData.commission || ''}
                                        onChange={(e) => setProfileData({
                                            ...profileData,
                                            commission: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(profileData.commission)}</p>
                                )}
                            </div>
                            
                            <div>
                                <h3 className={H3_STYLE}>День рождения</h3>
                                {isEditing && editableFields.date_of_birth ? (
                                    <input
                                        type="date"
                                        className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`}
                                        value={profileData.date_of_birth || ''}
                                        onChange={(e) => setProfileData({
                                            ...profileData,
                                            date_of_birth: e.target.value
                                        })}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(profileData.date_of_birth)}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-row gap-6">
                            <div>
                                <h3 className={H3_STYLE}>Номер телефона</h3>
                                {isEditing && editableFields.number_phone ? (
                                    <input
                                        className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`}
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
                                        className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`}
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Блок мероприятий */}
            {currentUserAccessLevel >= 2 && (
                <div className="w-[600px] h-auto bg-[#292C33] rounded-3xl p-6">
                    <div className="flex items-center mb-6">
                        <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                        <h2 className="font-gilroy_semibold text-white text-[32px] leading-[38px]">
                            {isOwnProfile ? 'Мои мероприятия' : 'Мероприятия пользователя'}
                        </h2>
                    </div>

                    {events.length > 0 ? (
                        <div className="grid grid-cols-3 gap-6">
                            {events.map(event => (
                                <div key={event.id} className="bg-[#394150] p-4 rounded-xl">
                                    <h3 className="font-gilroy_semibold text-white text-xl mb-2">{event.title}</h3>
                                    <p className="text-white text-opacity-70 text-sm">{event.description}</p>
                                    <p className="text-white text-opacity-50 text-xs mt-2">
                                        {new Date(event.date).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-white text-opacity-50">
                            {isOwnProfile 
                                ? 'У вас пока нет мероприятий' 
                                : 'У пользователя нет мероприятий'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Profile;