import React from 'react';
import { GoogleLogout } from 'react-google-login';

const client_id = ""

const Logout = ({setUser}) => {
    const onSuccess = () => {
        alert('you have logged out');
        setUser({
            id: null,
            email: '',
            first_name: '',
            last_name: '',
        });
    };

    return (
        <div>
            <GoogleLogout 
                clientId={clientId}
                buttonText="Logout"
                onLogoutSuccess={onSuccess}
                render={renderProps => (
                    <button onClick={renderProps.onClick} disabled={renderProps.disabled} className="btn btn-block">Log Out</button>
                )}
                className="btn btn-secondary google-log-btn"
            />
        </div>
    )
}

export default Logout;