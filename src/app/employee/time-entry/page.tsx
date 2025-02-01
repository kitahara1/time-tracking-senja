'use client';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const TimeEntryPage = () => {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const formatToUTC = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return '';
    const date = new Date(dateTimeLocal);
    return date.toISOString();
  };

  const validateTimes = (): boolean => {
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    const now = new Date();

    if (startDate > endDate) {
      setMessage({ type: 'error', text: 'Start time cannot be later than end time' });
      return false;
    }

    if (startDate > now) {
      setMessage({ type: 'error', text: 'Start time cannot be in the future' });
      return false;
    }

    if (endDate > now) {
      setMessage({ type: 'error', text: 'End time cannot be in the future' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!validateTimes()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/time-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || '',
        },
        body: JSON.stringify({
          employeeId: userData?.employeeId,
          startTime: formatToUTC(formData.startTime),
          endTime: formatToUTC(formData.endTime),
          description: formData.description,
        }),
      });

      if (response.ok) {
        setFormData({
          startTime: '',
          endTime: '',
          description: '',
        });
        setMessage({ type: 'success', text: 'Time entry submitted successfully!' });
      } else {
        throw new Error('Failed to submit time entry');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error submitting time entry' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage(null);
  };

  return (
    <DefaultLayout>
      <div className="h-[calc(100vh-160px)] rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Log New Time Entry
          </h3>
        </div>
        <form className="p-6.5" onSubmit={handleSubmit}>
          {message && (
            <div className={`mb-4 rounded-sm ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-600' 
                : 'bg-red-50 border border-red-200 text-red-600'
              } px-4 py-3`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Start Time
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              required
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              End Time
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-2.5 block text-black dark:text-white">
              Description
            </label>
            <textarea
              rows={6}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
          >
            {isLoading ? 'Submitting...' : 'Submit Time Entry'}
          </button>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default TimeEntryPage; 