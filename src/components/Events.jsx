import React from "react";
import Modal from 'react-modal';
import axios from "axios";
import {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { format } from 'date-fns';
import avatar_placeholder from "../photos/avatar_placeholder.png";
import { BASE_URL } from "./Globals";

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-white';
const textStyleRegular = 'font-gilroy_regular text-black';
const EVENT_PLACEHOLDER_STYLE = 'w-[412px] h-[244px] rounded-3xl bg-[#36536A] p-6 mb-[12px] mr-[12px]';

const modalWindowStyle = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgb(113 121 140)',
        width: '75%',
        height: '75%',
        borderRadius: '24px',
        padding: '32px',
    },
  };

const Events = () => {
    const [modalIsOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState([]);
    
    const [events, setEvents] = useState([]);

    const [title, setTitle] = useState('');
    const [description, setDesc] = useState('');

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
        axios.post(`${BASE_URL}/projects/projects/10/create_google_document/`, data, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        } ,{ withCredentials: true })
        .then(response => {})
        .catch(error => { console.error('There was an error!', error); });
    }

    const createEvent = async (e) => {
        const data = {
            id: 193,
            title: title,
            description: description,
            date: format(new Date(), 'yyyy-MM-dd'),
            organizers: [localStorage.getItem('current_profile_id')],
            files: null,
            tasks: '',
            participants: [1],
            projects: [],
            is_past: false
        };

        axios.post(`${BASE_URL}/api/events/`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
        .then(response => {
            const successMessage = document.getElementById('success');
            successMessage.classList.remove('hidden');
        })
    }

    return (
        <div id='background' className="bg-[#71798C] w-screen h-screen p-6">
            <div className="bg-[#292C33] rounded-3xl p-6 h-full overflow-y-scroll">
                <div className="flex items-center mb-[24px]">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className={`${textStyleSemibold} text-[40px] leading-[48px] mr-auto`}>Мероприятия</h1>
                    <button className={`${buttonStyle} mr-3`}>Сортировать</button>
                    <button className={`${buttonStyle} w-[260px]`} onClick={openModal}>Создать мероприятие</button>
                </div>
                <Modal
                    isOpen={modalIsOpen}
                    onRequestClose={closeModal}
                    contentLabel="Example Modal"
                    style={modalWindowStyle}
                >
                    <div className="flex gap-6 mb-6">
                        <p className={`${textStyleSemibold} text-[40px] leading-[48px]`}>Название:</p>
                        <input type="text" 
                        className="w-[600px]"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required></input>
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
                    <button className={`${buttonStyle} w-[260px]`} onClick={createEvent}>Создать мероприятие</button>
                </Modal>
                <div id='success' className="hidden w-[610px] h-fit bg-[#5C6373] z-50
                absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2
                rounded-3xl p-6 text-center">
                    <p className={`font-gilroy_heavy text-white w-fit text-[32px] mx-auto mb-12`}>Мероприятие успешно создано!</p>
                    <button onClick={() => {
                        const successMessage = document.getElementById('success');
                        successMessage.classList.add('hidden');
                        setIsOpen(false);
                    }} className={`${buttonStyle}`}>Подтвердить</button>
                </div>
                <div className="flex justify-start flex-wrap">
                    {events.map((event) => {
                        if (!event.is_past) {
                        return <Link to={`/event?id=${event.id}`}>
                            <div className={`${EVENT_PLACEHOLDER_STYLE} flex flex-col`}>
                                <h3 className={`${textStyleSemibold} text-[32px] leading-[43px] mb-3 text-white truncate`}>{event.title}</h3>
                                <p className={`${textStyleRegular} text-[20px] leading-[24px] mb-[51px] text-white truncate`}>{event.description}</p>
                                <p className={`${textStyleSemibold} text-[20px] leading-[24px] mb-1 text-white mt-auto`}>Организатор</p>
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
