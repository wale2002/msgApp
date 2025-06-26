// appfolder/types/axios.d.ts
import { InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    startTime?: number;
  }
}
