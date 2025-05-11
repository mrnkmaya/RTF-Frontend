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
    const eventData = Object.fromEntries(new URLSearchParams(useLocation().search));
    const [event, setEvent] = useState([]);
    const [users, setUsers] = useState([]);
    const [project, setProject] = useState([]);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [isFolderOpen, setIsFolderOpen] = useState(false);
    const [filesModalIsOpen, setFilesModalIsOpen] = useState(false);

    useEffect(() => {
        if(localStorage.getItem('access_token') === null){                   
            window.location.href = '/'
        } else {
            (async () => {
                try {
                    const data = await axios.get(`${BASE_URL}/api/event/${eventData.id}/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setEvent(data.data);

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
            })()
        };
    }, [eventData.id]);

    let orgs = {};
    for (const user of users) {
        orgs[user.id] = user.full_name;
    }

    let projects = {};
    for (const pro of project) {
        projects[pro.id] = pro;
    }

    const updateEvent = (updatedEvent) => {
        axios.put(`${BASE_URL}/api/event/${eventData.id}/`, updatedEvent, {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
            }
        })
        .then(response => {}) 
        .catch(error => { console.log(error); });
    };

    const updateOrganizers = (selectedUserIds) => {
        const updatedEvent = {
          ...event,
          organizers: selectedUserIds
        };
        
        axios.put(`${BASE_URL}/api/event/${eventData.id}/`, updatedEvent, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
          }
        })
        .then(response => {
          setEvent(updatedEvent); // Обновляем локальное состояние
        })
        .catch(error => console.log(error));
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
        // Создаем обновленный объект события
        const updatedEvent = {
            ...event,
            is_past: newStatus,
            date: newStatus === false ? format(new Date(), 'yyyy-MM-dd') : event.date
        };
        
        // Отправляем обновленные данные на сервер
        axios.put(`${BASE_URL}/api/event/${eventData.id}/`, updatedEvent, {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
            }
        })
        .then(response => {
            // После успешного ответа обновляем локальное состояние
            setEvent(updatedEvent);
        }) 
        .catch(error => { 
            console.log(error);
            // Можно добавить уведомление об ошибке
        });
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
                                axios.put(`${BASE_URL}/api/event/${eventData.id}/`, event, {
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                    }
                                })
                                .then(response => {})
                                .catch(error => console.log(error));
                            }
                            setIsEditing(!isEditing);
                        }
                    }>{isEditing ? 'Подтвердить' : 'Редактировать'}</button>
                </div>
                {isFolderOpen
                ? 
                <div className="flex justify-between">
                <div>
                    <p className="font-gilroy_heavy text-[48px] text-[#0D062D] leading-[61px] mb-[12px]">{event.title}</p>
                    <p className="font-gilroy_heavy text-[32px] text-[#0D062D] leading-[39px] mb-[12px]">Название папки</p>
                    <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Файлы</p>
                    <button className={`${buttonStyle} w-[200px] h-fit`} onClick={() => {setFilesModalIsOpen(true)}}>Создать Google файл</button>
                    <Modal
                    isOpen={filesModalIsOpen}
                    contentLabel="Example Modal"
                    style={filesModalWindowStyle}
                    onRequestClose={closeModal}
                    >
                        <h2 className={`font-gilroy_bold text-[#0D062D] text-[32px] leading-[39px] text-center mb-[41px]`}>Создать Google сервис</h2>
                        <div className="flex gap-6 mb-6">
                            <p className={`font-gilroy_bold text-[#0D062D] text-[24px] leading-[30px]`}>Тип документа: </p>
                            <select id='document_type'>
                                <option value={`doc`}>Документ</option>
                                <option value={`sheet`}>Таблица</option>
                                <option value={`slide`}>Презентация</option>
                                <option value={`form`}>Форма</option>
                            </select>
                        </div>
                        <div className="flex gap-6 mb-6">
                            <p className={`font-gilroy_bold text-[#0D062D] text-[24px] leading-[30px]`}>Название документа:</p>
                            <input id='doc_name' 
                            type="text" 
                            className=""
                            required></input>
                        </div>
                        <div className="flex gap-6 mb-6">
                            <p className={`font-gilroy_bold text-[#0D062D] text-[24px] leading-[30px]`}>Название для файла:</p>
                            <input id='file_name'
                            type="text" 
                            className=""
                            required></input>
                        </div>
                        <button className={`${buttonStyle} w-[260px] block mx-auto`} onClick={() => {
                            const select = document.getElementById('document_type');
                            const type = select.options[select.selectedIndex].value;
                            const doc_name = document.getElementById('doc_name');
                            const file_name = document.getElementById('file_name');
                            createFile(type, doc_name.value, file_name.value);
                        }}>Создать</button>
                    </Modal>
                </div>
                <div className="flex flex-col">
                    <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Статус</p>
                    <div className={`w-[186px] h-[54px] rounded-xl items-center p-3
                        ${event.is_past ? 'bg-[#2B4733]'  : 'bg-[#5C5838]' }`}>
                        <p className={`${textStyleSemibold} text-center text-[28px] leading-[34px]`}>{event.is_past ? 'Прошло' : 'В процессе' }</p>
                    </div>
                    {/* Тут должен быть статус, участники и рейтинг */}
                    </div>
                </div>
                : 
                <div className="flex justify-between">
                <div className="w-auto break-all">
                    <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Название</p>
                    {isEditing
                    ? <input className="mb-6 bg-[#F1F1F1] h-[40px] rounded pl-[10px]
                    " type="text" value={`${event.title}`} onChange={(e) => {setEvent({...event, title: e.target.value })}}/>
                    : <p className="font-gilroy_heavy text-[48px] text-[#0D062D] leading-[61px] mb-[12px]">{event.title}</p>
                    }
                    <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Дата</p>
                    {isEditing
                    ? <input className="mb-6 bg-[#F1F1F1] h-[40px] rounded pl-[10px]" type='date' onChange={(e) => {setEvent({...event, date: e.target.value })}}/>
                    : <p className="font-gilroy_bold text-[24px] text-[#0D062D] leading-[30px] mb-[12px]">{formateDate(event.date)}</p>
                    }
                    <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50 `}>Описание</p>
                    {isEditing
                    ? <input className="mb-6 bg-[#F1F1F1] h-[40px] rounded pl-[10px]" type="textarea" value={`${event.description}`} onChange={(e) => {setEvent({...event, description: e.target.value })}}/>
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
                        //     <div 
                        //     className="bg-[#CCE8FF] w-[200px] h-fit rounded-xl px-[12px] py-[8px] text-[#0D062D] font-gilroy_semibold font-[20px] leading-[25px] mb-3"  
                        //     onClick={() => setIsFolderOpen(true)}
                        //   >
                        //     {projects[proId]?.title}
                        //   </div>
                            // <Link key={proId} to={`/folder?projid=${proId}&eventid=${event.id}`} className="bg-[#CCE8FF] w-[200px] h-fit rounded-xl px-[12px] py-[8px] text-[#0D062D] font-gilroy_semibold font-[20px] leading-[25px] mb-3"
                            // onClick={() => {setIsFolderOpen(true)}}>{projects[proId]?.title}</Link>
                        })
                        }
                    </div>
                    {isEditing
                    ?<form id='folderForm'>
                        <input className="bg-[#F1F1F1] rounded mr-[10px]" type="text" id="folderName" required/>
                        <button type="button" onClick={(evt) => {createFolder()}} className={`${buttonStyle}`}>Создать</button>
                    </form>
                    :<div></div>
                    }
                </div>
                <div className="flex flex-col">
                    <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Статус</p>
                    <div className={`w-[186px] h-[54px] rounded-xl items-center p-3
                        ${event.is_past ? 'bg-[#2B4733]'  : 'bg-[#5C5838]' }`}>
                        <p className={`${textStyleSemibold} text-center text-[28px] leading-[34px]`}>{event.is_past ? 'Прошло' : 'В процессе' }</p>
                    </div>
                    {/* Тут должен быть статус, участники и рейтинг */}
                </div>
            </div>
                }
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
        </div>
    );
}

export default Event