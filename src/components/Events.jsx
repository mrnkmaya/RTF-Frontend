import React from "react";
import Modal from 'react-modal';
import axios from "axios";
import {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { format } from 'date-fns';
import avatar_placeholder from "../photos/avatar_placeholder.png";
import { BASE_URL } from "./Globals";

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-[#0D062D]';
const textStyleRegular = 'font-gilroy_regular text-black';
const EVENT_PLACEHOLDER_STYLE = 'w-[412px] h-[244px] rounded-3xl bg-[#CCE8FF] p-6 mb-[12px] mr-[12px]';

const modalWindowStyle = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#FFFFFF',
        width: '328px',
        height: '126px',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
    },
  };

  const Notification = ({ message, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      
      return () => clearTimeout(timer);
    }, [onClose]);
  
    return (
      <div className="absolute top-3/4 left-1/2 -translate-x-1/2 z-50
                     w-[600px] h-[60px] bg-[#DCF0DD] z-50 rounded-[15px] 
                     border-4 border-[#549D73] flex items-center justify-center
                     gap-[10px] p-4 shadow-lg animate-fadeIn">
        <svg className="w-6 h-6 text-[#549D73]" viewBox="0 0 24 24" fill="none">
          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="font-gilroy_heavy text-[#0D062D] text-[24px] leading-[30px]">
          {message}
        </p>
      </div>
    );
  };

const Events = () => {
    const [modalIsOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState([]);
    
    const [events, setEvents] = useState([]);

    const [title, setTitle] = useState('');
    const [description, setDesc] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [search, setSearch] = useState('');
    const [dateSort, setDateSort] = useState('newest'); // newest, oldest
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        if(localStorage.getItem('access_token') === null){                   
            window.location.href = '/'
        } else {
            (async () => {
                try {
                    const data = await axios.get(`${BASE_URL}/api/events/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setEvents(data.data);

                    const usersData = await axios.get(`${BASE_URL}/api/users/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setUsers(usersData.data);
                } catch(e) {
                    console.log(e);
                }
            })()
        };
    }, []);

    let orgs = {};
    for (const user of users) {
        orgs[user.id] = user.full_name;
    }

    function openModal() {
        setIsOpen(true);
    }
    
    function closeModal() {
        setIsOpen(false);
    }

    function createFile() {
        const data = { 
            doc_type: 'doc', 
            title: 'ThisIsTitle', 
            custom_name: 'ThisIsCustomName' 
        };
        axios.post(`${BASE_URL}/projects/10/create_google_document/`, data, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        } ,{ withCredentials: true })
        .then(response => {})
        .catch(error => { console.error('There was an error!', error); });
    }

    const createEvent = async (e) => {
        // Проверка наличия организатора
        const organizerId = parseInt(localStorage.getItem('profile_id'));
        if (!organizerId || isNaN(organizerId)) {
            alert('Ошибка: Не указан организатор. Пожалуйста, войдите в систему.');
            return;
        }
    
        // Проверка обязательных полей
        if (!title.trim()) {
            console.log('Пожалуйста, укажите название мероприятия');
            return;
        }
    
        // Формируем данные с учетом требований сервера
        const data = {
            title: title,
            description: description || "",
            date: format(new Date(), 'yyyy-MM-dd'),
            organizers: [organizerId],  // Используем проверенный ID
            is_past: false,  // Явно указываем значение
            participants: [],
            projects: []
        };
    
        try {
            console.log('Отправляемые данные:', data);  // Для отладки
            
            const response = await axios.post(`${BASE_URL}/api/events/`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
    
            // Обработка успешного создания
            
            
            // Обновление списка мероприятий
            const updatedEvents = await axios.get(`${BASE_URL}/api/events/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            setEvents(updatedEvents.data);
            setShowSuccess(true);
            setIsOpen(false);
            // Очистка формы
            setTitle('');
            setDesc('');
    
        } catch (error) {
            console.error('Ошибка создания:', error.response?.data || error.message);
            alert(`Ошибка: ${error.response?.data?.detail || 'Не удалось создать мероприятие'}`);
        }
    }

    // Фильтрация мероприятий по поиску
    let filteredEvents = events.filter(event => {
        const searchLower = search.toLowerCase();
        return (
            event.title?.toLowerCase().includes(searchLower) ||
            event.description?.toLowerCase().includes(searchLower)
        );
    });

    // Фильтр по диапазону дат
    filteredEvents = filteredEvents.filter(event => {
        if (!event.date) return true;
        const eventDate = new Date(event.date);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (from && eventDate < from) return false;
        if (to && eventDate > to) return false;
        return true;
    });

    // Сортировка по дате
    filteredEvents = filteredEvents.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        if (dateSort === 'newest') {
            return new Date(b.date) - new Date(a.date);
        } else {
            return new Date(a.date) - new Date(b.date);
        }
    });

    return (
        <div id='background' className="bg-[#ECF2FF] w-screen h-auto p-6">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 h-screen overflow-y-scroll">
                <div className="flex items-center mb-[24px] flex-wrap gap-3">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className={`${textStyleSemibold} text-[40px] leading-[48px] mr-auto`}>Мероприятия</h1>
                    {/* Поисковик */}
                    <input
                        type="text"
                        placeholder="Поиск по названию или описанию..."
                        className="w-[320px] h-[40px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8] px-4 mr-4 text-[18px]"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {/* Фильтр по дате */}
                    <select
                        className="h-[40px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8] px-2 text-[16px] mr-2"
                        value={dateSort}
                        onChange={e => setDateSort(e.target.value)}
                    >
                        <option value="newest">Сначала новые</option>
                        <option value="oldest">Сначала старые</option>
                    </select>
                    <input
                        type="date"
                        className="h-[40px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8] px-2 text-[16px] mr-2"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        placeholder="От"
                    />
                    <input
                        type="date"
                        className="h-[40px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8] px-2 text-[16px] mr-4"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        placeholder="До"
                    />
                    <button className={`${buttonStyle} w-[260px]`} onClick={openModal}>Создать мероприятие</button>
                </div>
                <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Example Modal"
                style={modalWindowStyle}
                >
                <div className="flex flex-col items-center w-full gap-3">
                <div className="flex flex-col w-full max-w-[280px]">
                    <input type="text" 
                    className="w-[280px] h-[34px] rounded bg-[#F1F1F1] pl-[10px]"
                    placeholder="Название:"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required></input>
                </div>
                <button className={`text-[15px] rounded-[12px] bg-[#00D166] px-[7px] w-[171px] h-[32px] flex items-center justify-center gap-[10px] text-white font-medium hover:bg-[#00C15A] transition-colors`} onClick={createEvent}>Создать мероприятие</button>
                </div>
                    {/* <div className="flex gap-6 mb-6">
                        <p className={`${textStyleSemibold} text-[40px] leading-[48px]`}>Организатор:</p>
                        <input type="text" 
                        className="w-[600px]"
                        value={organizers}
                        onChange={(e) => setOrganizers(e.target.value)}
                        required></input>
                    </div> */}
                    {/* <div className="flex gap-6 mb-6">
                        <p className={`${textStyleSemibold} text-[40px] leading-[48px]`}>Дата:</p>
                        <input type="date" 
                        className="w-[600px]"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required></input>
                    </div> */}
                    {/* <div className="flex gap-6 mb-6">
                        <p className={`${textStyleSemibold} text-[40px] leading-[48px]`}>Задачи:</p>
                        <input type="text" className="w-[600px]" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Задача..."></input>
                        <button onClick={addElement} className={`${buttonStyle} w-[200px]`}>Добавить задачу</button>
                    </div>
                    <ul className="p-0 m-0" onClick={makeTaskDone}>
                        {children.map((child, index) => <li key={index} className={`${taskStyle}`}>{child}</li>)}
                    </ul> */}
                    {/* <button className={`${buttonStyle} w-[260px]`} onClick={() => {setFilesModalIsOpen(true)}}>Добавить файлы</button> */}
                    
                </Modal>
                {showSuccess && (
                <Notification 
                    message="Мероприятие успешно создано!" 
                    onClose={() => setShowSuccess(false)} 
                />
            )}
                <div className="flex justify-start flex-wrap">
                    {filteredEvents.map((event) => {
                        if (!event.is_past) {
                        return <Link to={`/event?id=${event.id}`} key={event.id} >
                            <div className={`${EVENT_PLACEHOLDER_STYLE} flex flex-col`}>
                                <h3 className={`${textStyleSemibold} text-[32px] leading-[43px] mb-3 text-[#0D062D] truncate`}>{event.title}</h3>
                                <p className={`${textStyleRegular} text-[20px] leading-[24px] mb-[51px] text-[#0D062D] truncate`}>{event.description}</p>
                                <p className={`${textStyleSemibold} text-[20px] leading-[24px] mb-1 text-[#0D062D] mt-auto`}>Организатор</p>
                                <div className="flex">
                                    <img src={avatar_placeholder} alt='Аватарка организатора' width='23' height='23' className="rounded-[50%] mr-1"/>
                                    {   
                                        event.organizers[0] !== undefined
                                        ? <p className={`${textStyleSemibold}`}>{orgs[event.organizers[0]]}</p>
                                        : <p className={`${textStyleSemibold}`}>Не указано</p>
                                    }
                                </div>
                            </div>
                        </Link>}
                    })}
                </div>
            </div>
        </div>
    );
}

export default Events;
