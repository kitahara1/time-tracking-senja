"use client";
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Employee {
  _id: string;
  name: string;
  email: string;
  totalHours: number;
}

const AllEmployees = () => {
  const { userData } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      router.push('/');
    }
  }, [userData, router]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employee`, {
        headers: {
          Authorization: token || '',
          'ngrok-skip-browser-warning': 'true'
        },
      });

      if (response.ok) {
        const res = await response.json();
        const data = res.data.employeeList;
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setMessage({ type: 'error', text: 'Failed to load employees' });
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchEmployees();
    }
  }, [userData]);

  if (!userData || userData.role !== 'admin') {
    return null;
  }

  return (
    <DefaultLayout>
      <div className="flex h-[calc(100vh-160px)] flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            All Employees
          </h3>
        </div>
        <div className="flex flex-col flex-grow p-6.5 overflow-hidden">
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

          <div className="flex flex-col flex-grow rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="relative flex flex-col flex-grow overflow-hidden">
              <div className="absolute inset-0 overflow-auto">
                <table className="w-full table-auto">
                  <thead className="sticky top-0 bg-gray-2 dark:bg-meta-4">
                    <tr className="text-left">
                      <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                        Name
                      </th>
                      <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white">
                        Email
                      </th>
                      <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                        Total Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4">
                          Loading...
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee, key) => (
                        <tr key={key}>
                          <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                            {employee.name}
                          </td>
                          <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                            {employee.email}
                          </td>
                          <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                            {employee.totalHours}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default AllEmployees; 