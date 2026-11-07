// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
/** Native entry points never display or subscribe to the web product introduction. */
export default function WebEntryGate({children}:{children:React.ReactNode}){return <>{children}</>;}
