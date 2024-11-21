import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Books.css';

const Payments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    navigate('/');
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get('http://localhost:3030/bookings');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleDelete = async (bookingID) => {
    try {
      await axios.delete(`http://localhost:3030/bookings/delete/${bookingID}`);
      setPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== bookingID));
    } catch (error) {
      console.error(`Error deleting payment with Booking ID ${bookingID}:`, error);
    }
  };

  const handleAccept = async (bookingID) => {
    try {
      const response = await axios.put(`http://localhost:3030/bookings/accept/${bookingID}`);
      if (response.data.message) {
        fetchPayments();
      }
    } catch (error) {
      console.error(`Error accepting payment with Booking ID ${bookingID}:`, error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) =>
    payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.id.toString().includes(searchTerm)
  );

  return (
    <div className="container-fluid">
      <div className="row">
        <nav className="col-md-2 bg-dark sidebar">
          <div className="text-white text-center py-3">
            <h4>Emperor's Lounge</h4>
          </div>
          <hr className="text-white" />
          <div className="d-flex flex-column align-items-center">
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/admin')}>
              <i className="fas fa-home"></i> Dashboard
            </button>
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/custbook')}>
              <i className="fas fa-calendar-alt"></i> Customer's Booking
            </button>
            <button className="nav-link text-white btn btn-link" onClick={() => navigate('/payments')}>
              <i className="fas fa-credit-card"></i> Payment
            </button>
            <button className="nav-link text-white btn btn-link" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Log out
            </button>
          </div>
        </nav>

        <main className="col-md-10 mt-5">
        <div className="header-search-container mb-4">
            <h2 className="text-center">Payment</h2>
            <div className="search-bar">
            <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search" />
            </div>
        </div>

        <div className="card">
            <div className="card-body">
            <div className="table-responsive">
                <table className="table table-striped">
                <thead>
                    <tr>
                    <th>Booking ID</th>
                    <th>Name</th>
                    <th>Service Price</th>
                    <th>Contact No</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                        <td>{payment.id}</td>
                        <td>{payment.customerName}</td>
                        <td>₱{payment.servicePrice.toFixed(2)}</td>
                        <td>{payment.contactNo}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>
                        <span
                            style={{
                            backgroundColor:
                                payment.status === 'Completed' ? 'green' :
                                payment.status === 'Pending' ? '#d9a23d' :
                                payment.status === 'Canceled' ? 'red' : 'lightgray',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                            }}
                        >
                            {payment.status}
                        </span>
                        </td>
                        <td>
                        {payment.status === 'Pending' && (
                            <button
                            className="btn btn-success custom-btn"
                            onClick={() => handleAccept(payment.id)}
                            >
                            <i className="fas fa-check"></i>
                            </button>
                        )}
                        <button
                            className="btn btn-danger custom-btn ml-2"
                            onClick={() => handleDelete(payment.id)}
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        </div>
        </main>
      </div>
    </div>
  );
};

export default Payments;