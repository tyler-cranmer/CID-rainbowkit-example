import {
  addressRegistryAbi,
  namespaceAbi,
  cidNftAbi,
  pfpWrapperAbi,
} from '../abis';
import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { fontTransformer } from '../helpers';
import {
  CID_NFT_CONTRACT,
  NAMESPACE_CONTRACT,
  ADDRESS_REGISTRY_CONTRACT,
  SUB_PFP,
  PFP_WRAPPER_CONTRACT,
} from '../constants';
import { erc721ABI } from 'wagmi';
import { CIDType } from '../types';
import { useEffect, useState } from 'react';
import { Account } from 'viem';

export const useCID = (address: `0x${string}`) => {
    const [CID, setCID] = useState<CIDType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null> (null);

    useEffect(() => {
        setLoading(true);

        const fetchImage = async (uri: string) => {
            try {
              const res = await fetch(uri);
              return await res.json();
            } catch (e) {
              console.log('Failed to fetch image:', e);
              return null;
            }
          };
          
          const transformURI = (uri: string) => {
            if (uri.includes('ipfs://')) {
              return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            if (uri.includes('ar://')) {
              return uri.replace('ar://', 'https://arweave.net/');
            }
            return uri;
          };
          
          const getCID = async (address: `0x${string}`) => {
            let CID: CIDType = {
              walletAddress: address,
              displayName: null,
              baseName: null,
              profPic: null,
            };
          
            const userCIDId: BigInt = (await readContract({
              address: ADDRESS_REGISTRY_CONTRACT,
              abi: addressRegistryAbi,
              functionName: 'getCID',
              args: [address],
            })) as BigInt;
          
            if (!userCIDId) return CID;
          
            const cidsNamespace = (await readContract({
              address: CID_NFT_CONTRACT,
              abi: cidNftAbi,
              functionName: 'getPrimaryData',
              args: [userCIDId, 'namespace'],
            })) as BigInt;
          
            if(cidsNamespace) {
              const namespace = (await readContract({
                  address: NAMESPACE_CONTRACT,
                  abi: namespaceAbi,
                  functionName: 'getNamespaceCharacters',
                  args: [cidsNamespace],
                })) as string[];
          
                if (namespace.length) {
                  CID.displayName = namespace.join('');
                  CID.baseName = `${namespace.map(fontTransformer).join('')}.canto`;
                }
            }
          
            const cidsPfp = (await readContract({
              address: CID_NFT_CONTRACT,
              abi: cidNftAbi,
              functionName: 'getPrimaryData',
              args: [userCIDId, SUB_PFP],
            })) as BigInt;
          
            if(cidsPfp) {
              const pfpInfo = (await readContract({
                  address: PFP_WRAPPER_CONTRACT,
                  abi: pfpWrapperAbi,
                  functionName: 'pfp',
                  args: [cidsPfp],
                })) as any;
          
                const pfpMeta = (await readContract({
                  address: pfpInfo[0],
                  abi: erc721ABI,
                  functionName: 'tokenURI',
                  args: [pfpInfo[1]],
                })) as string;
          
                if (pfpMeta) {
                  const transformedUri = transformURI(pfpMeta)
                  const image = await fetchImage(transformedUri)
                  if (image) {
                      CID.profPic = {
                        src: image.image,
                        alt: image.name,
                        id: image.id,
                      };
                    }
                }
            }
            console.log("CID", CID)
          return CID
          };


          const fetchData = async () => {
            try {
                const cidData = await getCID(address);
                setCID(cidData);
            } catch (e: any) {
                setError(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [address])

    return {CID, loading, error}
}
