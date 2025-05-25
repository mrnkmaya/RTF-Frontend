import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import Modal from 'react-modal';
import { BASE_URL } from "./Globals";
import MinusIcon from '../photos/minus.svg';
import FileIcon from '../photos/file.svg';

// Установка appElement для react-modal (добавьте в начале файла)
Modal.setAppElement('#root');

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-[#0D062D]';

const filesModalWindowStyle = {
  content: {
    top: '362px',
    left: '496px',
    right: 'auto',
    bottom: 'auto',
    width: '448px',
    height: '176px',
    borderRadius: '24px',
    padding: '16px',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    border: 'none',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
  },
};

const greenButtonStyle = 'bg-[#00D166] w-[140px] h-[36px] rounded-[12px] flex items-center justify-center mx-auto font-gilroy_medium text-[16px] leading-[100%] tracking-[0px] text-white px-4';

const Folder = () => {
    const folderData = Object.fromEntries(new URLSearchParams(useLocation().search));
    const projId = folderData['project_id'];
    const eventId = folderData['event_id'];
    const [event, setEvent] = useState({});
    const [project, setProject] = useState({});
    const [fileName, setFileName] = useState('');
    const [docType, setDocType] = useState('doc');
    const [filesModalIsOpen, setFilesModalIsOpen] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('access_token')) {
            window.location.href = '/';
            return;
        }

        if (!eventId || !projId) {
            console.error('Отсутствуют необходимые параметры:', { eventId, projId });
            setMessage({
                text: 'Ошибка: отсутствуют необходимые параметры',
                type: 'error'
            });
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Исправленные URL запросов
                const eventResponse = await axios.get(`${BASE_URL}/api/event/${eventId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setEvent(eventResponse.data);

                const projectResponse = await axios.get(`${BASE_URL}/projects/${projId}/`, {
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
                `${BASE_URL}/projects/${projId}/create_google_service/`, 
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
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            closeModal();
            
            // Обновляем данные проекта после создания файла
            const updatedProject = await axios.get(`${BASE_URL}/projects/${projId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            setProject(updatedProject.data);
        } catch (error) {
            console.error('Ошибка создания файла:', error);
            // setMessage({
            //     text: error.response?.data?.message || 'Ошибка создания файла',
            //     type: 'error'
            // });
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
                    <button 
                        onClick={() => navigate(`/event?id=${eventId}`)}
                        className="mr-4 text-[#0D062D] hover:text-[#0077EB] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
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
                                    <div key={file.id} className="flex items-center mb-1">
                                        <button
                                            className="mr-2"
                                            onClick={async () => {
                                                if (window.confirm('Удалить файл?')) {
                                                    try {
                                                        setLoading(true);
                                                        await axios.delete(`${BASE_URL}/projects/api/project_file/${file.id}/`, {
                                                            headers: {
                                                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                                            }
                                                        });
                                                    } catch (error) {
                                                        if (error.response && error.response.status === 404) {
                                                            setMessage({
                                                                text: 'Файл уже был удалён или не найден. Список обновлён.',
                                                                type: 'error'
                                                            });
                                                        } else {
                                                            alert('Ошибка при удалении файла');
                                                        }
                                                    } finally {
                                                        // В любом случае обновляем список файлов
                                                        const updatedProject = await axios.get(`${BASE_URL}/projects/${projId}/`, {
                                                            headers: {
                                                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                                            }
                                                        });
                                                        setProject(updatedProject.data);
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                        >
                                            <img src={MinusIcon} alt="Удалить" className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center bg-[#F4F4F4] hover:bg-[#E0E0E0] rounded-xl px-[12px] py-[8px] transition-colors">
                                            <img src={FileIcon} alt="Файл" className="w-5 h-5 mr-[10px]" />
                                            <a 
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-gilroy_semibold text-[#0D062D] text-[20px] leading-[25px] text-center"
                                            >
                                                {file.file_name}
                                            </a>
                                        </div>
                                    </div>
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
                            <div className="flex flex-col gap-[12px]">
                                <input 
                                    type="text" 
                                    className="pl-[10px] rounded border p-1 flex-1 mb-2 bg-[#F1F4F9] text-[#0D062D] text-[16px]"
                                    placeholder="Название"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <select 
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="rounded p-1 border bg-[#F1F4F9] text-[#0D062D] text-[16px] mb-2"
                                    disabled={loading}
                                >
                                    <option value="doc">Документ</option>
                                    <option value="sheet">Таблица</option>
                                    <option value="slide">Презентация</option>
                                    <option value="form">Форма</option>
                                </select>
                            <button 
                                    className={greenButtonStyle}
                                    style={{fontFamily: 'Gilroy', fontWeight: 500, letterSpacing: 0}}
                                onClick={createFile}
                                disabled={!fileName.trim() || loading}
                            >
                                    {loading ? 'Создание...' : 'Создать файл'}
                            </button>
                            </div>
                        </Modal>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Folder;