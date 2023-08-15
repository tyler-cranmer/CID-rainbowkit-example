import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import CustomConnectButton from './CustomConnectButton';
import { addressRegistryAbi, namespaceAbi, cidNftAbi, bioAbi } from '../abis';
import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { fromHex } from 'viem';
import { fontTransformer } from '../helpers';
import { CID_NFT_CONTRACT, NAMESPACE_CONTRACT, BIO_CONTRACT, SUB_BIO } from '../constants';
const Home: NextPage = () => {
  const { address } = useAccount();
  const name = 'Pikachu';
  const tyler = '0x035bC96201666333294C5A04395Bb3618a2b6A11';


  useEffect(() => {
    const getIdentities = async (address: string) => {
      const IdentityContract = await readContract({
        address: CID_NFT_CONTRACT,
        abi: cidNftAbi,
        functionName: 'balanceOf',
        args: [address],
      });
      const data = IdentityContract as any;
    if(!IdentityContract){
      console.log(address)
      return address
      // Would return here.
    }
        const CIDS = [] as any[];
        const balance = fromHex(data, 'number');
        console.log('Balance', balance);
        const tokensPromises = new Array(balance).fill(0).map((_, i) => {
          return readContract({
            address: CID_NFT_CONTRACT,
            abi: cidNftAbi,
            functionName: 'tokenOfOwnerByIndex',
            args: [address!, i],
          });
        });
        const tokens = await Promise.all(tokensPromises).then((data: any) => {
          return data;
        });
        console.log("TOKENS", tokens);
        tokens.forEach((t: any) => {
          CIDS.push({
            id: t,
            namespace: null,
            pfp: null,
            bio: null
          })
        })
        console.log("CIDS", CIDS)
        const cidsNamespacesPromises = tokens.map((t: any) => {
          return readContract({
            address: CID_NFT_CONTRACT,
            abi: cidNftAbi,
            functionName: "getPrimaryData",
            args: [t, "namespace"]
          })
        })
        const cidsNamespaces = await Promise.all(cidsNamespacesPromises)
        .then((data: any) => {
          return data;
        })
        .catch((e) => {
          return null;
        });
        console.log("CID NAMESPACES", cidsNamespaces )
      const charPromises = cidsNamespaces.map((t: any) => {
        return readContract({
          address: NAMESPACE_CONTRACT,
          abi: namespaceAbi,
          functionName: "getNamespaceCharacters",
          args: [t],
        });
      });
      const chars = await Promise.allSettled(charPromises)
      .then((data: any) => {
        return data.map((result: any) => {
          if (result.status === "fulfilled") {
            return result.value;
          } else {
            console.error("Error:", result.reason);
            return null;
          }
        });
      })
      .catch((e) => {
        console.error("Error:", e);
        return null;
      });
      console.log("chars", chars)
      const namespaces = cidsNamespaces.map((t: any, i: number) => {
        if (!chars[i]) return null;
        const displayName = chars[i].map((c: any) => c).join("");
        const baseName =
          chars[i].map((c: any) => fontTransformer(c)).join("") + ".canto";
        return { id: t, displayName, baseName };
      });
      namespaces.forEach((n: any, i: number) => {
        CIDS[i].namespace = n;
      });

      const cidsBiosPromises = tokens.map((t: any) => {
        return readContract({
          address: CID_NFT_CONTRACT,
          abi: cidNftAbi,
          functionName: "getPrimaryData",
          args: [t, SUB_BIO],
        });
      });
      const cidsBios = await Promise.all(cidsBiosPromises)
        .then((data: any) => {
          return data;
        })
        .catch((e) => {
          return null;
        });

      const bioPromises = cidsBios.map((t: any) => {
        return readContract({
          address: BIO_CONTRACT,
          abi: bioAbi,
          functionName: "bio",
          args: [t],
        });
      });

      const bios = await Promise.allSettled(bioPromises)
        .then((data: any) => {
          return data.map((result: any) => {
            if (result.status === "fulfilled") {
              return result.value;
            } else {
              console.error("Error:", result.reason);
              return null;
            }
          });
        })
        .catch((e) => {
          console.error("Error:", e);
          return null;
        });

      bios.forEach((b: any, i: number) => {
        CIDS[i].bio = b;
      });

      return CIDS
      }
    const a = getIdentities(address!)
    console.log("HELOP", a);
  });

  return (
    <div className={styles.container}>
      <Head>
        <title>RainbowKit App</title>
        <meta
          content='Generated by @rainbow-me/create-rainbowkit'
          name='description'
        />
        <link href='/favicon.ico' rel='icon' />
      </Head>

      <main className={styles.main}>
        <ConnectButton />
        <CustomConnectButton />
        {/* <div>{!!address ? <p>data: {dataString}</p> : 'pink'}</div> */}

        <h1 className={styles.title}>
          Welcome to <a href=''>RainbowKit</a> + <a href=''>wagmi</a> +{' '}
          <a href='https://nextjs.org'>Next.js!</a>
        </h1>

        <p className={styles.description}>
          Get started by editing{' '}
          <code className={styles.code}>pages/index.tsx</code>
        </p>

        <div className={styles.grid}>
          <a className={styles.card} href='https://rainbowkit.com'>
            <h2>RainbowKit Documentation &rarr;</h2>
            <p>Learn how to customize your wallet connection flow.</p>
          </a>

          <a className={styles.card} href='https://wagmi.sh'>
            <h2>wagmi Documentation &rarr;</h2>
            <p>Learn how to interact with Ethereum.</p>
          </a>

          <a
            className={styles.card}
            href='https://github.com/rainbow-me/rainbowkit/tree/main/examples'
          >
            <h2>RainbowKit Examples &rarr;</h2>
            <p>Discover boilerplate example RainbowKit projects.</p>
          </a>

          <a className={styles.card} href='https://nextjs.org/docs'>
            <h2>Next.js Documentation &rarr;</h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a
            className={styles.card}
            href='https://github.com/vercel/next.js/tree/canary/examples'
          >
            <h2>Next.js Examples &rarr;</h2>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            className={styles.card}
            href='https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app'
          >
            <h2>Deploy &rarr;</h2>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a href='https://rainbow.me' rel='noopener noreferrer' target='_blank'>
          Made with ❤️ by your frens at 🌈
        </a>
      </footer>
    </div>
  );
};

export default Home;
