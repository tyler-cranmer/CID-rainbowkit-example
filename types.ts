import { Account } from "viem";

export interface CIDType {
    walletAddress: `0x${string}`;
    displayName: string | null;
    baseName: string | null;
    profPic: ProfilePicture | null;
    
}

export interface ProfilePicture {
    src : string;
    alt: string;
    id: number;

}