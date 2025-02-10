export interface LayoutContextType {
    isVisible: boolean;
    setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    currentStar: string;
    setCurrentStar: React.Dispatch<React.SetStateAction<string>>;
    selected: any;
    setSelected: React.Dispatch<React.SetStateAction<any>>;
}
