import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom'; 
import { format, parse, isSameDay } from 'date-fns';
import axios from "axios";
import { Link } from "react-router-dom";
import Modal from 'react-modal';
import { BASE_URL } from "./Globals";

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-[#0d062d]';
const textStyleRegular = 'font-gilroy_regular text-black';
const EVENT_PLACEHOLDER_STYLE = 'w-[412px] h-[244px] rounded-3xl bg-[#DCF0DD] p-4 mb-[12px] mr-[12px]';

const EventsOnDay = () => {
    const query = new URLSearchParams(useLocation().search);
    const eventDate = parse(query.get('date'), 'yyyy-MM-dd', new Date());
    const curMonth = eventDate.toLocaleString('ru', {month: "long"});
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    let thisDayEvents = events.filter(event => isSameDay(new Date(event.date), format(eventDate, 'yyyy-MM-dd')))
    if (thisDayEvents === undefined) {
        thisDayEvents = [];
    }

    const [modalIsOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [organizers, setOrganizers] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

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

    function openModal() {
        setIsOpen(true);
    }
    
    function closeModal() {
        setIsOpen(false);
    }

    // function createFile() {
    //     const data = { 
    //         doc_type: 'doc', 
    //         title: 'ThisIsTitle', 
    //         custom_name: 'ThisIsCustomName' 
    //     };
    //     axios.post(`${BASE_URL}/projects/10/create_google_service/`, data, {
    //         headers: {
    //             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    //         }
    //     } ,{ withCredentials: true })
    //     .then(response => {})
    //     .catch(error => { console.error('There was an error!', error); });
    // }

    const createEvent = async (e) => {
        // Проверяем, что название мероприятия указано
        if (!title.trim()) {
            alert('Пожалуйста, укажите название мероприятия');
            return;
        }    
    
        const data = {
            title: title,
            description: description || "",  
            date: format(eventDate, 'yyyy-MM-dd'),  // Используем дату из календаря
            participants: [],  
            projects: [],  
            is_past: false,  
        };
    
        try {
            const response = await axios.post(`${BASE_URL}/api/events/`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
    
            // Обновляем список мероприятий
            const updatedEvents = await axios.get(`${BASE_URL}/api/events/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            setEvents(updatedEvents.data);
    
            // Показываем уведомление и закрываем модальное окно
            setShowSuccess(true);
            setIsOpen(false);
            // Очищаем форму
            setTitle('');
            setDesc('');
    
        } catch (error) {
            console.error('Ошибка при создании мероприятия:', error.response?.data || error.message);
            alert(`Ошибка: ${error.response?.data?.detail || 'Не удалось создать мероприятие'}`);
        }
    };

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
                } catch(e) {
                    console.log(e);
                }
            })()
        };
    }, []);

    return (
        <div className='mx-auto p-6 bg-[#ECF2FF] w-screen h-screen'>
            <div className="bg-[#FFFFFF] rounded-3xl p-6 h-full overflow-y-scroll">
                <div className="flex items-center mb-[24px]">
                <button 
                    onClick={() => navigate('/calendar')}
                    className="mr-4 text-[#0D062D] hover:text-[#0077EB] transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className={`${textStyleSemibold} text-[40px] leading-[48px] mr-auto`}>Календарь</h1>
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
                    <select>
                        <option>Выберите организатора</option>
                        <option>Роман Гареев</option>
                        <option>Олег</option>
                        <option>Я</option>
                    </select>
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
                {/* <button className={`${buttonStyle} w-[260px]`} onClick={createFile}>Добавить файлы</button> */}
                
            </Modal>
            {showSuccess && (
                <Notification 
                    message="Мероприятие успешно создано!" 
                    onClose={() => setShowSuccess(false)} 
                />
                )}
                <h2 className="text-[#0d062d] font-gilroy_heavy text-[48px] leading-[61px]">
                    <span className="text-[100px] leading-[127px] mr-[16px]">{`${format(eventDate, 'dd')}`}</span> {curMonth === 'май' ? 'мая' :
                        curMonth.endsWith('ь') ?
                        curMonth.slice(0, -1) + 'я' :
                        curMonth + 'а'}
                </h2>
                <div className="flex justify-start flex-wrap">
                    {thisDayEvents.map((event) => {
                        return <Link to={`/event?id=${event.id}`}>
                            <div className={`${EVENT_PLACEHOLDER_STYLE}`}>
                                <h3 className={`${textStyleSemibold} text-[32px] leading-[43px] mb-3 text-[#0D062D] truncate`}>{event.title}</h3>
                                <p className={`${textStyleRegular} text-[20px] leading-[24px] mb-[51px] text-[#0D062D] truncate`}>{event.description}</p>
                                <p className={`${textStyleSemibold} text-[20px] leading-[24px] mb-1 text-[#0D062D]`}>Организатор</p>
                                <div className="flex">
                                    {/* <img alt='Аватарка организатора' width='23' height='23' className="rounded-[50%] mr-1" src=''/> */}
                                    <p className={`${textStyleSemibold} `}>{event.organizers[0]}</p>
                                </div>
                            </div>
                        </Link>
                    })}
                </div>
            </div>
        </div>
    );
};

export default EventsOnDay;