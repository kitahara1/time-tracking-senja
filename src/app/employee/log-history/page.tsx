"use client";
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface TimeEntry {
  _id: string;
  start_time: string;
  end_time: string;
  description: string;
}

const LogHistory = () => {
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<TimeEntry | null>(null);
  
  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Tambahkan state untuk pesan error di modal
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Ubah fungsi formatLocalDateTime
  const formatLocalDateTime = (utcDateString: string) => {
    const date = new Date(utcDateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).replace(',', ''); // Hapus koma antara tanggal dan waktu
  };

  // Tambahkan fungsi format untuk datetime
  const formatToUTC = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return '';
    // Buat date object dengan menganggap input sebagai waktu lokal
    const [datePart, timePart] = dateTimeLocal.split('T');
    const [hours, minutes] = timePart.split(':');
    
    // Buat string ISO dengan waktu yang sama persis
    return `${datePart}T${hours}:${minutes}:00.000Z`;
  };

  // Tambahkan fungsi validasi
  const validateTimes = (startTime: string, endTime: string): { isValid: boolean; message: string } => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start > end) {
      return {
        isValid: false,
        message: 'Start time cannot be later than end time'
      };
    }

    if (start > now) {
      return {
        isValid: false,
        message: 'Start time cannot be in the future'
      };
    }

    if (end > now) {
      return {
        isValid: false,
        message: 'End time cannot be in the future'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  };

  const fetchTimeEntries = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.NEXT_PUBLIC_API_URL}/time-entry?employeeId=${userData?.employeeId}`;
      if (filterDate) {
        url += `&date=${filterDate}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: token || '',
          'ngrok-skip-browser-warning': 'true'
        },
      });

      if (response.ok) {
        const res = await response.json();
        const data = res.data.timeEntryList;
        setTimeEntries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      setMessage({ type: 'error', text: 'Failed to load time entries' });
      setTimeEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.employeeId) {
      fetchTimeEntries();
    }
  }, [userData?.employeeId, filterDate]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    // Reset pesan error
    setEditMessage(null);

    // Validasi waktu sebelum mengirim ke server
    const validation = validateTimes(editData.start_time, editData.end_time);
    if (!validation.isValid) {
      setEditMessage({ type: 'error', text: validation.message });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/time-entry?id=${editData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || '',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          startTime: formatToUTC(editData.start_time),
          endTime: formatToUTC(editData.end_time),
          description: editData.description,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Time entry updated successfully' });
        fetchTimeEntries();
        setShowEditModal(false);
      } else {
        throw new Error('Failed to update time entry');
      }
    } catch (error) {
      setEditMessage({ type: 'error', text: 'Error updating time entry' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/time-entry?id=${deleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token || '',
          'ngrok-skip-browser-warning': 'true'
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Time entry deleted successfully' });
        fetchTimeEntries();
        setShowDeleteModal(false);
      } else {
        throw new Error('Failed to delete time entry');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting time entry' });
    }
  };

  // Tambahkan fungsi untuk menutup modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditMessage(null); // Reset pesan saat modal ditutup
  };

  return (
    <DefaultLayout>
      <div className="h-[calc(100vh-160px)] rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Time Entry History
          </h3>
        </div>
        <div className="p-6.5">
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
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                      Start Time
                    </th>
                    <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white">
                      End Time
                    </th>
                    <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white">
                      Description
                    </th>
                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : timeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        No entries found
                      </td>
                    </tr>
                  ) : (
                    timeEntries.map((entry, key) => (
                      <tr key={key}>
                        <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                          {formatLocalDateTime(entry.start_time)}
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          {formatLocalDateTime(entry.end_time)}
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          {entry.description}
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <div className="flex items-center space-x-3.5">
                            <button
                              className="hover:text-primary"
                              onClick={() => {
                                setEditData(entry);
                                setShowEditModal(true);
                              }}
                            >
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.5562 8.99981 13.5562C13.1061 13.5562 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.44374 8.99981 4.44374C4.89356 4.44374 2.4748 7.95936 1.85605 8.99999Z"
                                  fill=""
                                />
                                <path
                                  d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.875C8.38125 7.875 7.875 8.38125 7.875 9C7.875 9.61875 8.38125 10.125 9 10.125C9.61875 10.125 10.125 9.61875 10.125 9C10.125 8.38125 9.61875 7.875 9 7.875Z"
                                  fill=""
                                />
                              </svg>
                            </button>
                            <button
                              className="hover:text-primary"
                              onClick={() => {
                                setDeleteId(entry._id);
                                setShowDeleteModal(true);
                              }}
                            >
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                                  fill=""
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Modal */}
          {showEditModal && (
            <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black bg-opacity-40">
              <div className="w-full max-w-xl rounded-sm bg-white p-8 shadow-lg dark:bg-boxdark">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-black dark:text-white">
                    Edit Time Entry
                  </h4>
                  <button
                    onClick={handleCloseEditModal}
                    className="text-gray-500 hover:text-gray-600"
                  >
                    <svg
                      className="fill-current"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M11.8913 9.99599L19.5043 2.38635C19.8164 2.07478 19.8164 1.56821 19.5043 1.25664C19.1922 0.945073 18.6848 0.945073 18.3727 1.25664L10.7596 8.86628L3.14662 1.25664C2.8345 0.945073 2.32705 0.945073 2.01488 1.25664C1.70271 1.56821 1.70271 2.07478 2.01488 2.38635L9.62788 9.99599L2.01488 17.6056C1.70271 17.9172 1.70271 18.4238 2.01488 18.7354C2.17596 18.8961 2.38829 18.9766 2.60075 18.9766C2.81321 18.9766 3.02554 18.8961 3.18662 18.7354L10.7596 11.1257L18.3727 18.7354C18.5338 18.8961 18.7461 18.9766 18.9586 18.9766C19.171 18.9766 19.3834 18.8961 19.5443 18.7354C19.8164 18.4238 19.8164 17.9172 19.5043 17.6056L11.8913 9.99599Z"
                        fill=""
                      />
                    </svg>
                  </button>
                </div>
                {editMessage && (
                  <div className={`mb-4 rounded-sm ${
                    editMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-600' 
                      : 'bg-red-50 border border-red-200 text-red-600'
                    } px-4 py-3`}
                  >
                    {editMessage.text}
                  </div>
                )}
                <form onSubmit={handleEdit}>
                  <div className="mb-4.5">
                    <label className="mb-2.5 block text-black dark:text-white">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editData?.start_time.slice(0, 16)}
                      onChange={(e) =>
                        setEditData(prev => ({
                          ...prev!,
                          start_time: e.target.value
                        }))
                      }
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
                      value={editData?.end_time.slice(0, 16)}
                      onChange={(e) =>
                        setEditData(prev => ({
                          ...prev!,
                          end_time: e.target.value
                        }))
                      }
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
                      value={editData?.description}
                      onChange={(e) =>
                        setEditData(prev => ({
                          ...prev!,
                          description: e.target.value
                        }))
                      }
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleCloseEditModal}
                      className="rounded border border-stroke py-2 px-6 text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded bg-primary py-2 px-6 text-white hover:bg-opacity-90"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black bg-opacity-40">
              <div className="rounded-sm bg-white p-8 shadow-lg dark:bg-boxdark">
                <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                  Confirm Delete
                </h4>
                <p className="mb-6">Are you sure you want to delete this time entry?</p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="rounded border border-stroke py-2 px-6 text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="rounded bg-danger py-2 px-6 text-white hover:bg-opacity-90"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default LogHistory; 