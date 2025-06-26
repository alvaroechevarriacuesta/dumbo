import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useChat } from '../../contexts/ChatContext';

const contextSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type ContextFormData = z.infer<typeof contextSchema>;

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddContextModal: React.FC<AddContextModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { addContext } = useChat();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContextFormData>({
    resolver: zodResolver(contextSchema),
  });

  const onSubmit = async (data: ContextFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addContext({
        name: data.name,
        description: data.description,
      });
      
      reset();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create context';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Context" className="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
            <p className="text-error-700 dark:text-error-400 text-sm">{submitError}</p>
          </div>
        )}

        <Input
          label="Context Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g., Project Planning, Research Notes"
          disabled={isSubmitting}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            {...register('description')}
            placeholder="Brief description of what this context is for..."
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-secondary-400 dark:placeholder:text-secondary-500 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Context
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddContextModal;