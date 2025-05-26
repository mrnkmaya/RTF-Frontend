import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "./Globals";
import Modal from 'react-modal';

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-[#0D062D]';
const textStyleRegular = 'font-gilroy_regular text-black';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('users'); // 'users' или 'events'
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [newUser, setNewUser] = useState({
        email: '',
        full_name: '',
        password: '',
        access_level: 1,
        status: '',
        commission: '',
        number_phone: '',
        adress: '',
        date_of_birth: null
    });
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: ''
    });

    const userModalStyle = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#FFFFFF',
            width: '800px',
            maxHeight: '90vh',
            borderRadius: '24px',
            padding: '24px',
            overflowY: 'auto'
        },
    };

    const eventModalStyle = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#FFFFFF',
            width: '500px',
            borderRadius: '24px',
            padding: '24px',
        },
    };

    useEffect(() => {
        if(localStorage.getItem('access_token') === null || localStorage.getItem('access_level') !== '3'){                   
            window.location.href = '/'
        } else {
            fetchUsers();
            fetchEvents();
        }
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/users/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            console.log('Initial users data:', response.data);

            // Получаем данные профилей для каждого пользователя
            const usersWithProfiles = await Promise.all(
                response.data.map(async (user) => {
                    try {
                        // Получаем профиль
                        const profileResponse = await axios.get(`${BASE_URL}/api/profile/${user.id}/`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                            }
                        });
                        console.log('Profile data for user', user.id, ':', profileResponse.data);
                        
                        // Создаем объект с данными пользователя
                        const userWithProfile = {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            full_name: user.full_name,
                            status: profileResponse.data.profile?.status || '',
                            commission: profileResponse.data.profile?.commission || '',
                            number_phone: profileResponse.data.profile?.number_phone || '',
                            adress: profileResponse.data.profile?.adress || '',
                            date_of_birth: profileResponse.data.profile?.date_of_birth || '',
                            access_level: profileResponse.data.profile?.access_level || 1
                        };
                        console.log('Combined user data:', userWithProfile);
                        return userWithProfile;
                    } catch (error) {
                        console.error(`Error fetching profile for user ${user.id}:`, error);
                        return {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            full_name: user.full_name,
                            status: '',
                            commission: '',
                            number_phone: '',
                            adress: '',
                            date_of_birth: '',
                            access_level: 1
                        };
                    }
                })
            );
            console.log('Final users data:', usersWithProfiles);
            setUsers(usersWithProfiles);
        } catch(e) {
            console.error('Error fetching users:', e);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/events/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            setEvents(response.data);
        } catch(e) {
            console.error('Error fetching events:', e);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            try {
                await axios.delete(`${BASE_URL}/api/users/${userId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                fetchUsers();
            } catch(e) {
                console.error('Error deleting user:', e);
            }
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
            try {
                await axios.delete(`${BASE_URL}/api/event/${eventId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                fetchEvents();
            } catch(e) {
                console.error('Error deleting event:', e);
            }
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                // При редактировании отправляем все поля кроме пароля и даты рождения, если они не были изменены
                const userData = { ...newUser };
                if (!userData.password) {
                    delete userData.password;
                }
                if (!userData.date_of_birth) {
                    delete userData.date_of_birth;
                }
                await axios.put(`${BASE_URL}/api/profile/${selectedUser.id}/`, userData, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
            } else {
                // При создании нового пользователя отправляем все поля
                const userData = {
                    username: newUser.username,
                    password: newUser.password,
                    email: newUser.email,
                    full_name: newUser.full_name,
                    access_level: newUser.access_level,
                    status: newUser.status || '',
                    commission: newUser.commission || '',
                    number_phone: newUser.number_phone || '',
                    adress: newUser.adress || '',
                    date_of_birth: newUser.date_of_birth || null
                };

                await axios.post(`${BASE_URL}/api/users/`, userData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
            }
            setIsUserModalOpen(false);
            fetchUsers();
        } catch(e) {
            console.error('Error saving user:', e);
            if (e.response?.data) {
                console.error('Validation errors:', e.response.data);
            }
        }
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedEvent) {
                await axios.put(`${BASE_URL}/api/event/${selectedEvent.id}/`, newEvent, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
            } else {
                const eventData = {
                    ...newEvent,
                    is_past: false
                };
                await axios.post(`${BASE_URL}/api/events/`, eventData, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
            }
            setIsEventModalOpen(false);
            fetchEvents();
        } catch(e) {
            console.error('Error saving event:', e);
        }
    };

    useEffect(() => {
        if (selectedUser) {
            setNewUser({
                email: selectedUser.email || '',
                full_name: selectedUser.full_name || '',
                password: '',
                access_level: selectedUser.access_level || 1,
                status: selectedUser.status || '',
                commission: selectedUser.commission || '',
                number_phone: selectedUser.number_phone || '',
                adress: selectedUser.adress || '',
                date_of_birth: selectedUser.date_of_birth || ''
            });
        } else {
            setNewUser({
                email: '',
                full_name: '',
                password: '',
                access_level: 1,
                status: '',
                commission: '',
                number_phone: '',
                adress: '',
                date_of_birth: ''
            });
        }
    }, [selectedUser]);

    useEffect(() => {
        if (selectedEvent) {
            setNewEvent({
                title: selectedEvent.title,
                description: selectedEvent.description,
                date: selectedEvent.date
            });
        } else {
            setNewEvent({
                title: '',
                description: '',
                date: ''
            });
        }
    }, [selectedEvent]);

    return (
        <div className='mx-auto p-6 bg-[#ECF2FF] w-screen min-h-screen'>
            <div className="bg-[#FFFFFF] rounded-3xl p-6 min-h-[calc(100vh-48px)]">
                <div className="flex items-center mb-[24px]">
                    <h1 className={`${textStyleSemibold} text-[40px] leading-[48px] mr-auto`}>Админ-панель</h1>
                </div>

                <div className="flex gap-4 mb-6">
                    <button 
                        className={`${buttonStyle} ${activeTab === 'users' ? 'bg-[#0053a4]' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Пользователи
                    </button>
                    <button 
                        className={`${buttonStyle} ${activeTab === 'events' ? 'bg-[#0053a4]' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Мероприятия
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <button 
                            className={buttonStyle}
                            onClick={() => {
                                setSelectedUser(null);
                                setIsUserModalOpen(true);
                            }}
                        >
                            Добавить пользователя
                        </button>
                        <div className="grid grid-cols-1 gap-4">
                            {users.map(user => (
                                <div key={user.id} className="bg-[#F1F4F9] p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className={textStyleSemibold}>{user.full_name}</h3>
                                        <p className={textStyleRegular}>{user.email}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            className={buttonStyle}
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsUserModalOpen(true);
                                            }}
                                        >
                                            Редактировать
                                        </button>
                                        <button 
                                            className={`${buttonStyle} bg-red-500`}
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-4">
                        <button 
                            className={buttonStyle}
                            onClick={() => {
                                setSelectedEvent(null);
                                setIsEventModalOpen(true);
                            }}
                        >
                            Добавить мероприятие
                        </button>
                        <div className="grid grid-cols-1 gap-4">
                            {events.map(event => (
                                <div key={event.id} className="bg-[#F1F4F9] p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className={textStyleSemibold}>{event.title}</h3>
                                        <p className={textStyleRegular}>{event.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            className={buttonStyle}
                                            onClick={() => {
                                                setSelectedEvent(event);
                                                setIsEventModalOpen(true);
                                            }}
                                        >
                                            Редактировать
                                        </button>
                                        <button 
                                            className={`${buttonStyle} bg-red-500`}
                                            onClick={() => handleDeleteEvent(event.id)}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isUserModalOpen}
                onRequestClose={() => setIsUserModalOpen(false)}
                style={userModalStyle}
                contentLabel="User Modal"
            >
                <h2 className={`${textStyleSemibold} text-[24px] mb-4`}>
                    {selectedUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
                </h2>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {!selectedUser && (
                            <div>
                                <label className={textStyleRegular}>Имя пользователя</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className={textStyleRegular}>Email</label>
                            <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className={textStyleRegular}>Полное имя</label>
                            <input
                                type="text"
                                value={newUser.full_name}
                                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className={textStyleRegular}>Пароль</label>
                            <input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                className="w-full p-2 border rounded"
                                required={!selectedUser}
                                placeholder={selectedUser ? "Оставьте пустым, чтобы не менять" : "Введите пароль"}
                            />
                        </div>
                        <div>
                            <label className={textStyleRegular}>Уровень доступа</label>
                            <select
                                value={newUser.access_level}
                                onChange={(e) => setNewUser({...newUser, access_level: parseInt(e.target.value)})}
                                className="w-full p-2 border rounded"
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                            </select>
                        </div>
                        <div>
                            <label className={textStyleRegular}>Должность</label>
                            <select
                                value={newUser.status}
                                onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Не указано</option>
                                <option value="Председатель">Председатель</option>
                                <option value="Заместитель председателя">Заместитель председателя</option>
                                <option value="Член комиссии">Член комиссии</option>
                            </select>
                        </div>
                        <div>
                            <label className={textStyleRegular}>Комиссия</label>
                            <select
                                value={newUser.commission}
                                onChange={(e) => setNewUser({...newUser, commission: e.target.value})}
                                className="w-full p-2 border rounded"
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
                        </div>
                        <div>
                            <label className={textStyleRegular}>Телефон</label>
                            <input
                                type="tel"
                                value={newUser.number_phone}
                                onChange={(e) => setNewUser({...newUser, number_phone: e.target.value})}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className={textStyleRegular}>Адрес</label>
                            <input
                                type="text"
                                value={newUser.adress}
                                onChange={(e) => setNewUser({...newUser, adress: e.target.value})}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className={textStyleRegular}>Дата рождения</label>
                            <input
                                type="date"
                                value={newUser.date_of_birth || ''}
                                onChange={(e) => setNewUser({...newUser, date_of_birth: e.target.value})}
                                className="w-full p-2 border rounded"
                                placeholder={selectedUser ? "Оставьте пустым, чтобы не менять" : "Выберите дату"}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsUserModalOpen(false)}
                            className={`${buttonStyle} bg-gray-500`}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className={buttonStyle}
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEventModalOpen}
                onRequestClose={() => setIsEventModalOpen(false)}
                style={eventModalStyle}
                contentLabel="Event Modal"
            >
                <h2 className={`${textStyleSemibold} text-[24px] mb-4`}>
                    {selectedEvent ? 'Редактировать мероприятие' : 'Добавить мероприятие'}
                </h2>
                <form onSubmit={handleEventSubmit} className="space-y-4">
                    <div>
                        <label className={textStyleRegular}>Название</label>
                        <input
                            type="text"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className={textStyleRegular}>Описание</label>
                        <textarea
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className={textStyleRegular}>Дата</label>
                        <input
                            type="date"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEventModalOpen(false)}
                            className={`${buttonStyle} bg-gray-500`}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className={buttonStyle}
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Admin; 