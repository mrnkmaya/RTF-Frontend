import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import axios from "axios";
import Modal from 'react-modal';
import { BASE_URL } from "./Globals";

// Установка appElement для react-modal (добавьте в начале файла)
Modal.setAppElement('#root');

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
    backgroundColor: '#ECF2FF',
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
    const [event, setEvent] = useState({});
    const [project, setProject] = useState({});
    const [fileName, setFileName] = useState('');
    const [docType, setDocType] = useState('doc');
    const [filesModalIsOpen, setFilesModalIsOpen] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('access_token')) {
            window.location.href = '/';
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Исправленные URL запросов
                const eventResponse = await axios.get(`${BASE_URL}/api/events/${eventId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setEvent(eventResponse.data);

                const projectResponse = await axios.get(`${BASE_URL}/api/projects/${projId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setProject(projectResponse.data);
            } catch (error) {
                console.error("Ошибка загрузки данных:", error);
                setMessage({
                    text: 'Ошибка загрузки данных',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId, projId]);

    const closeModal = () => {
        setFilesModalIsOpen(false);
        setFileName('');
    };

    const createFile = async () => {
        if (!fileName.trim()) return;

        try {
            setLoading(true);
            const response = await axios.post(
                `${BASE_URL}/api/projects/${projId}/create-document/`, 
                {
                    doc_type: docType,
                    title: fileName,
                    custom_name: fileName
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                }
            );

            setMessage({
                text: 'Файл успешно создан',
                type: 'success'
            });
            closeModal();
            
            // Обновляем данные проекта после создания файла
            const updatedProject = await axios.get(`${BASE_URL}/api/projects/${projId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            setProject(updatedProject.data);
        } catch (error) {
            console.error('Ошибка создания файла:', error);
            setMessage({
                text: error.response?.data?.message || 'Ошибка создания файла',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !event.title) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-2xl">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className='mx-auto p-6 bg-[#ECF2FF] w-screen min-h-screen'>
            {/* Сообщения */}
            {message.text && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg ${
                    message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white z-50`}>
                    {message.text}
                </div>
            )}

            <div className="bg-[#FFFFFF] rounded-3xl p-6 min-h-[calc(100vh-48px)]">
                <div className="flex items-center mb-[24px]">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className={`${textStyleSemibold} text-[40px] leading-[48px] mr-auto`}>Мероприятия</h1>
                </div>
                
                <div className="flex justify-between">
                    <div>
                        <p className="font-gilroy_heavy text-[48px] text-[#0D062D] leading-[61px] mb-[12px]">
                            {event.title || 'Название мероприятия'}
                        </p>
                        <p className="font-gilroy_heavy text-[32px] text-[#0D062D] leading-[39px] mb-[12px]">
                            {project.title || 'Название проекта'}
                        </p>
                        
                        <p className={`${textStyleSemibold} text-[16px] leading-[20px] text-opacity-50`}>Файлы</p>
                        <div className="flex flex-col mb-3">
                            {project.files?.length > 0 ? (
                                project.files.map((file) => (
                                    <a 
                                        key={file.id}
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#1F4466] w-[200px] h-fit rounded-xl px-[12px] py-[8px] 
                                        text-white font-gilroy_semibold text-[20px] leading-[25px] mb-1 text-center"
                                    >
                                        {file.file_name}
                                    </a>
                                ))
                            ) : (
                                <p className="text-gray-500">Нет файлов</p>
                            )}
                        </div>
                        
                        <button 
                            className={`${buttonStyle} w-[200px] h-fit ${loading ? 'opacity-50' : ''}`} 
                            onClick={() => setFilesModalIsOpen(true)}
                            disabled={loading}
                        >
                            {loading ? 'Загрузка...' : 'Создать Google файл'}
                        </button>
                        
                        <Modal
                            isOpen={filesModalIsOpen}
                            onRequestClose={closeModal}
                            style={filesModalWindowStyle}
                            ariaHideApp={false}
                        >
                            <h2 className={`font-gilroy_bold text-[#0D062D] text-[32px] leading-[39px] text-center mb-[41px]`}>
                                Создать Google сервис
                            </h2>
                            
                            <div className="flex gap-6 mb-6 items-center">
                                <p className={`font-gilroy_bold text-[#0D062D] text-[24px] leading-[30px]`}>Тип документа:</p>
                                <select 
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="rounded p-1 border"
                                    disabled={loading}
                                >
                                    <option value="doc">Документ</option>
                                    <option value="sheet">Таблица</option>
                                    <option value="slide">Презентация</option>
                                    <option value="form">Форма</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-6 mb-6 items-center">
                                <p className={`font-gilroy_bold text-[#0D062D] text-[24px] leading-[30px]`}>Название:</p>
                                <input 
                                    type="text" 
                                    className="pl-[10px] rounded border p-1 flex-1"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <button 
                                className={`${buttonStyle} w-[260px] block mx-auto ${loading ? 'opacity-50' : ''}`} 
                                onClick={createFile}
                                disabled={!fileName.trim() || loading}
                            >
                                {loading ? 'Создание...' : 'Создать'}
                            </button>
                        </Modal>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Folder;