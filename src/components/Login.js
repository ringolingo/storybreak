import React from 'react';
import { GoogleLogin } from 'react-google-login'
import axios from 'axios';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const Login = ({setUser}) => {
    const onSuccess = (response) => {
        console.log('[Login Success] currentUser:', response.profileObj);
        const userData = {
            id_token: response.getAuthResponse().id_token,
            email: response.profileObj.email,
            first_name: response.profileObj.givenName,
            last_name: response.profileObj.familyName
        }
        axios
            .post("api/users/", userData)
            .then((response) => {
                setUser(response.data);
            })
            .catch((error) => console.log(error.response))

        refreshTokenSetup(response);
    };

    const onFailure = (response) => {
        console.log('[Login Failed] response: ', response);
    };

    const refreshTokenSetup = (response) => {
        let refreshTiming = (response.tokenObj.expires_in || 3600 - 5 * 60) * 1000;

        const refreshToken = async () => {
            const newAuthResponse = await response.reloadAuthResponse();
            refreshTiming = (newAuthResponse.expires_in || 3600 - 5 * 60) * 1000;
            console.log("newAuthResponse:", newAuthResponse);
            console.log("new auth token", newAuthResponse.id_token);
            setTimeout(refreshToken, refreshTiming);
        };

        setTimeout(refreshToken, refreshTiming);
    }


    return (
        <div>
            <GoogleLogin
                clientId={clientId}
                buttonText="Login"
                onSuccess={onSuccess}
                onFailure={onFailure}
                cookiePolicy={'single_host_origin'}
                isSignedIn={true}
            />
        </div>
    );
}

export default Login;