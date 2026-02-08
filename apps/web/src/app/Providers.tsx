"use client";

import { Amplify } from "aws-amplify";
import { useEffect } from "react";
import outputs from "../../amplify_outputs.json"; 

let configured = false;

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (configured) return;
    Amplify.configure(outputs);
    configured = true;
  }, []);

  return <>{children}</>;
}
