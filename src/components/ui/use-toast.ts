
import { toast } from "sonner";
import { useToast as useToastOriginal } from "@/hooks/use-toast";

// Re-export both the toast function and useToast hook
export { toast, useToastOriginal as useToast };
