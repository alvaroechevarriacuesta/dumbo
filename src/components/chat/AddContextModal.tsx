import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Code, BookOpen, Lightbulb, Zap, Palette, Calculator, Globe } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useChat } from '../../contexts/ChatContext';

const contextSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  icon: z.string().min(1, 'Please select an icon'),
});

type ContextFormData = z.infer<typeof contextSchema>;

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableIcons = [
  { name: 'Brain', component: Brain, label: 'Brain' },
  { name: 'Code', component: Code, label: 'Code' },
  { name: 'BookOpen', component: BookOpen, label: 'Book' },
  { name: 'Lightbulb', component: Lightbulb, label: 'Lightbulb' },
  { name: 'Zap', component: Zap, label: 'Lightning' },
  { name: 'Palette', component: Palette, label: 'Palette' },
  { name: 'Calculator', component: Calculator, label: 'Calculator' },
  { name: 'Globe', component: Globe, label: 'Globe' },
];

const AddContextModal: React.FC<AddContextModalProps> = ({ isOpen, onClose }) => {
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const { addContext } = useChat();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ContextFormData>({
    resolver: zodResolver(contextSchema),
  });

  const onSubmit = async (data: ContextFormData) => {
    try {
      await addContext({
        name: data.name,
        description: data.description,
        icon: data.icon,
      });
      
      reset();
      setSelectedIcon('');
      onClose();
    } catch (error) {
      console.error('Failed to add context:', error);
    }
  };

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    setValue('icon', iconName);
  };

  const handleClose = () => {
    reset();
    setSelectedIcon('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Context" className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Context Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g., Math Tutor, Recipe Helper"
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Describe what this context is for and how it should help users..."
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-secondary-400 dark:placeholder:text-secondary-500 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white resize-none"
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Choose an Icon
          </label>
          <div className="grid grid-cols-4 gap-3">
            {availableIcons.map((icon) => {
              const IconComponent = icon.component;
              const isSelected = selectedIcon === icon.name;
              
              return (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => handleIconSelect(icon.name)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-1 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-secondary-200 dark:border-secondary-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 ${
                    isSelected
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-secondary-500 dark:text-secondary-400'
                  }`} />
                  <span className={`text-xs ${
                    isSelected
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-secondary-600 dark:text-secondary-400'
                  }`}>
                    {icon.label}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.icon && (
            <p className="mt-2 text-sm text-error-600 dark:text-error-400">
              {errors.icon.message}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit">
            Add Context
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddContextModal;