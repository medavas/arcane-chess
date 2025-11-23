import React from 'react';
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { Provider } from 'react-redux';
import { store } from 'src/app/store/configureStore';
import jwt_decode from 'jwt-decode';
import setAuthToken from 'src/shared/utils/setAuthToken';

import { PrivateRoute } from 'src/features/auth/components/PrivateRoute/PrivateRoute';

import { setCurrentUser, logoutUser } from 'src/features/auth/store/authActions';

import '@fontsource/exo';
import '@fontsource/exo/400-italic.css';
import '@fontsource/exo/700-italic.css';

import ConditionalAudioPlayer from 'src/shared/utils/audio/ConditionalAudioPlayer';

import { FrontPage } from 'src/features/landing/pages/frontPage/FrontPage';
import { Campaign } from 'src/features/campaign/pages/campaign/Campaign';
import { Dashboard } from 'src/features/dashboard/pages/Dashboard';
import { Book } from 'src/features/campaign/pages/book/Book';
import { Login } from 'src/features/auth/pages/Login';
import { Register } from 'src/features/auth/pages/Register';
import { LessonView } from 'src/features/campaign/pages/lessonView/LessonView';
import { TempleView } from 'src/features/campaign/pages/templeView/TempleView';
import { MissionView } from 'src/features/campaign/pages/missionView/MissionView';
import { QuickPlay } from 'src/features/game/pages/quickPlay/QuickPlay';
import { LeaderBoard } from 'src/features/leaderboard/pages/leaderboard/LeaderBoard';
import { Lexicon } from 'src/features/lexicon/pages/lexicon/Lexicon';
import { Manifest } from 'src/features/lexicon/pages/manifest/Manifest';
import { NotFound } from 'src/features/landing/pages/notFound/NotFound';

import { Skirmish } from 'src/features/game/pages/skirmish/Skirmish';

import ReactDOM from 'react-dom/client';
import Modal from 'react-modal';

// import App from './App';

// Check for token to keep user logged in
if (localStorage.jwtToken) {
  // Set auth token header auth
  const token = localStorage.jwtToken;
  setAuthToken(token);

  // Decode token and get user info and exp
  const decoded: { exp: number } = jwt_decode(token);

  // Set user and isAuthenticated
  store.dispatch(setCurrentUser(decoded));

  // Check for expired token
  const currentTime = Date.now() / 1000; // to get in milliseconds

  if (decoded.exp < currentTime) {
    // Logout user
    store.dispatch(logoutUser());

    // Redirect to login
    window.location.href = './intro';
  }
}

const MainLayout: React.FC = () => {
  const location = useLocation();
  return (
    <>
      <ConditionalAudioPlayer location={location} />
      <Outlet />
    </>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout />}>
      <Route path="/intro" element={<FrontPage />} />
      <Route
        index
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/manifest"
        element={
          // <PrivateRoute>
          //
          <Manifest />
          // </PrivateRoute>
        }
      />
      {/* <Route
        path="/lab"
        element={
          <PrivateRoute>
            <Lab />
          </PrivateRoute>
        }
      /> */}
      <Route
        path="/quickplay"
        element={
          <PrivateRoute>
            <QuickPlay />
          </PrivateRoute>
        }
      />
      <Route
        path="/campaign"
        element={
          <PrivateRoute>
            <Campaign />
          </PrivateRoute>
        }
      />
      <Route
        path="/chapter"
        element={
          <PrivateRoute>
            <Book />
          </PrivateRoute>
        }
      />
      <Route
        path="/lesson"
        element={
          <PrivateRoute>
            <LessonView />
          </PrivateRoute>
        }
      />
      <Route
        path="/temple"
        element={
          <PrivateRoute>
            <TempleView />
          </PrivateRoute>
        }
      />
      <Route
        path="/mission"
        element={
          <PrivateRoute>
            <MissionView />
          </PrivateRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <PrivateRoute>
            <LeaderBoard />
          </PrivateRoute>
        }
      />
      <Route
        path="/lexicon"
        element={
          <PrivateRoute>
            <Lexicon />
          </PrivateRoute>
        }
      />
      <Route
        path="/skirmish"
        element={
          <PrivateRoute>
            <Skirmish />
          </PrivateRoute>
        }
      />
      {/* <Route path="/stacktadium" element={<></>} />src/data/book9.json src/data/book10.json src/data/book11.json src/data/book12.json */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

function App() {
  return (
    <>
      <RouterProvider router={router}></RouterProvider>
    </>
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  Modal.setAppElement('#root');
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
  if ('serviceWorker' in navigator) {
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  }
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
