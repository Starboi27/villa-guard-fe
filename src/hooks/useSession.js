import { useContext } from 'react';
import { SessionContext } from '../SessionContext.js';

export const useSession = () => useContext(SessionContext);
