import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import axios from "axios";
import Modal from 'react-modal';
import { BASE_URL } from "./Globals";

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-white';

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

const Folder = () => {
    const folderData = Object.fromEntries(new URLSearchParams(useLocation().search));
    const projId = folderData['projid'];
    const eventId = folderData['eventid'];
    const [event, setEvent] = useState([]);
    const [project, setProject] = useState([]);

    // const [isEditing, setIsEditing] = useState(false);
    const [filesModalIsOpen, setFilesModalIsOpen] = useState(false);

    useEffect(() => {
        if(localStorage.getItem('access_token') === null){                   
            window.location.href = '/'
        } else {
            (async () => {
                try {
                    const data = await axios.get(`${BASE_URL}/api/event/${eventId}/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setEvent(data.data);

                    const proj = await axios.get(`http://127.0.0.1:8000/projects/projects/${projId}/`, {
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
    }, [eventId, projId]);

    function closeModal() {
        setFilesModalIsOpen(false);
    }

    function createFile(type, title, custom_name) {
        const data = { 
            doc_type: type, 
            title: title, 
            custom_name: custom_name
        };
        axios.post(`${BASE_URL}/projects/projects/${projId}/create_google_document/`, data, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        } ,{ withCredentials: true })
        .then(response => {
            const message = document.getElementById('succes_file');
            message.classList.remove('hidden');
            setFilesModalIsOpen(false);
            setTimeout(() => {
                message.classList.add('hidden');
            }, 3000);
        })
        .catch(error => { 
            console.error('There was an error!', error);
            const message = document.getElementById('error_file');
            message.classList.remove('hidden');
            setTimeout(() => {
                message.classList.add('hidden');
            }, 3000);
        });
    }

    return (
        <div className='mx-auto p-6 bg-[#71798C] w-screen h-screen'>
            <div className="bg-[#292C33] rounded-3xl p-6 h-full">
                <div className="flex items-center mb-[24px]">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className={`${textStyleSemibold} text-[40px] leading-[48px] mr-auto`}>Мероприятия</h1>
                    {/* <button className={`${buttonStyle} w-[200px]`} onClick={
                        (evt) => {
                            evt.preventDefault();
                            if (isEditing) {
                                axios.put(`http://127.0.0.1:8000/api/event/${eventId}/`, event, {
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                    }
                                })
                                .then(response => console.log(response))
                                .catch(error => console.log(error));
                            }
                            setIsEditing(!isEditing);
                        }
                    }>{isEditing ? 'Подтвердить' : 'Редактировать'}</button> */}
                </div>
                <div className="flex justify-between">
                    <div>
                        <p className="font-gilroy_heavy text-[48px] text-white leading-[61px] mb-[12px]">{event.title}</p>
                        <p className="font-gilroy_heavy text-[32px] text-white leading-[39px] mb-[12px]">{project.title}</p>
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Файлы</p>
                        <div className="flex flex-col mb-3">
                            {project.files?.map((file) => {
                                return <a href={`${file.file_url}`} className="bg-[#1F4466] w-[200px] h-fit rounded-xl px-[12px] py-[8px] 
                                text-white font-gilroy_semibold font-[20px] leading-[25px] mb-1 text-center">{file.file_name}</a>
                            })}
                        </div>
                        <button className={`${buttonStyle} w-[200px] h-fit`} onClick={() => {setFilesModalIsOpen(true)}}>Создать Google файл</button>
                        <Modal
                        isOpen={filesModalIsOpen}
                        contentLabel="Example Modal"
                        style={filesModalWindowStyle}
                        onRequestClose={closeModal}
                        >
                            <h2 className={`font-gilroy_bold text-white text-[32px] leading-[39px] text-center mb-[41px]`}>Создать Google сервис</h2>
                            <div className="flex gap-6 mb-6">
                                <p className={`font-gilroy_bold text-white text-[24px] leading-[30px]`}>Тип документа: </p>
                                <select id='document_type'>
                                    <option value={`doc`}>Документ</option>
                                    <option value={`sheet`}>Таблица</option>
                                    <option value={`slide`}>Презентация</option>
                                    <option value={`form`}>Форма</option>
                                </select>
                            </div>
                            <div className="flex gap-6 mb-6">
                                <p className={`font-gilroy_bold text-white text-[24px] leading-[30px]`}>Название документа:</p>
                                <input id='doc_name' 
                                type="text" 
                                className=""
                                required></input>
                            </div>
                            <div className="flex gap-6 mb-6">
                                <p className={`font-gilroy_bold text-white text-[24px] leading-[30px]`}>Название для файла:</p>
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
                </div>
            </div>
        </div>
    );
}

export default Folder;