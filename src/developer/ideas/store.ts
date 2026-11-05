// SPDX-License-Identifier: AGPL-3.0-only
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createIdeasStore } from './persistence';
export const ideasStore = createIdeasStore(AsyncStorage);
