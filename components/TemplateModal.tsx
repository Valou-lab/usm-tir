
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import type { WeeklyTemplate, TemplateDay } from '../types';
import { TrashIcon, PlusIcon } from './Icons';
import { addMonths, getMonthName } from '../utils/dateUtils';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDisplayMonth: Date;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, currentDisplayMonth }) => {
  const context = useContext(AppContext);
  const { currentUser, updateUser, applyUserTemplate } = context!;
  
  const [template, setTemplate] = useState<WeeklyTemplate>([]);

  useEffect(() => {
    if (currentUser?.template) {
      setTemplate(currentUser.template);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const weekdays = [
    { name: 'Lundi', value: 1 },
    { name: 'Mardi', value: 2 },
    { name: 'Mercredi', value: 3 },
    { name: 'Jeudi', value: 4 },
    { name: 'Vendredi', value: 5 },
    { name: 'Samedi', value: 6 },
    { name: 'Dimanche', value: 0 },
  ];
  
  const handleTemplateChange = <K extends keyof TemplateDay>(index: number, field: K, value: TemplateDay[K]) => {
    const newTemplate = [...template];
    newTemplate[index][field] = value;
    setTemplate(newTemplate);
  };

  const addTemplateDay = () => {
    setTemplate([...template, { dayOfWeek: 1, startTime: '16:00', endTime: '20:00' }]);
  };
  
  const removeTemplateDay = (index: number) => {
    setTemplate(template.filter((_, i) => i !== index));
  };
  
  const handleSaveTemplate = () => {
    if (currentUser) {
        updateUser({ ...currentUser, template });
        alert("Template sauvegardé !");
    }
  };

  const handleApplyTemplate = (month: 'current' | 'next') => {
      if (currentUser) {
          const targetMonth = month === 'next' ? addMonths(currentDisplayMonth, 1) : currentDisplayMonth;
          applyUserTemplate(currentUser.id, targetMonth);
          alert(`Template appliqué pour ${getMonthName(targetMonth).toLowerCase()} !`);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Gérer mon template</h2>
        
        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
            {template.map((day, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                    <select
                        value={day.dayOfWeek}
                        onChange={(e) => handleTemplateChange(index, 'dayOfWeek', parseInt(e.target.value))}
                        className="p-2 border border-gray-300 rounded-md shadow-sm"
                    >
                        {weekdays.map(w => <option key={w.value} value={w.value}>{w.name}</option>)}
                    </select>
                    <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => handleTemplateChange(index, 'startTime', e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    <span>-</span>
                    <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => handleTemplateChange(index, 'endTime', e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    <button onClick={() => removeTemplateDay(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            ))}
        </div>

        <button onClick={addTemplateDay} className="mt-4 flex items-center text-sm text-brand-primary font-semibold hover:text-sky-700">
            <PlusIcon className="w-5 h-5 mr-1" />
            Ajouter un jour
        </button>

        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-grow flex space-x-2">
                 <button onClick={() => handleApplyTemplate('current')} className="w-full px-4 py-2 bg-brand-accent text-gray-800 rounded-md hover:bg-amber-400 font-semibold">
                    Appliquer sur {getMonthName(currentDisplayMonth)}
                </button>
                <button onClick={() => handleApplyTemplate('next')} className="w-full px-4 py-2 bg-brand-accent text-gray-800 rounded-md hover:bg-amber-400 font-semibold">
                    Appliquer sur {getMonthName(addMonths(currentDisplayMonth, 1))}
                </button>
            </div>
            <div className="flex space-x-2">
                 <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Fermer</button>
                <button onClick={handleSaveTemplate} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-sky-700">Sauvegarder</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
