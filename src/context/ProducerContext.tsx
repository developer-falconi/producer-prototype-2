import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { fetchProducerData } from "@/lib/api";
import { Producer } from "@/lib/types";

interface ProducerContextType {
  producer: Producer | null;
  setProducer: React.Dispatch<React.SetStateAction<Producer | null>>;
  loadingProducer: boolean;
}

const ProducerContext = createContext<ProducerContextType | undefined>(undefined);

export const useProducer = (): ProducerContextType => {
  const context = useContext(ProducerContext);
  if (!context) {
    throw new Error("useProducer must be used within a ProducerProvider");
  }
  return context;
};

interface ProducerProviderProps {
  children: ReactNode;
}

export const ProducerProvider: React.FC<ProducerProviderProps> = ({ children }) => {
  const [producer, setProducer] = useState<Producer | null>(null);
  const [loadingProducer, setLoadingProducer] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchProducerData();
        if (response.success && response.data) {
          setProducer(response.data);
        }
      } catch (error) {
        console.error("Error fetching producer data:", error);
      } finally {
        setLoadingProducer(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ProducerContext.Provider value={{ producer, setProducer, loadingProducer }}>
      {children}
    </ProducerContext.Provider>
  );
};
