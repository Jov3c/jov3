import type { PrismaClient } from '../generated/prisma/client';

const defaults = [
  {
    slug: 'chengdu',
    countryCode: 'CN',
    countryName: 'China',
    cityName: '成都',
    regionName: '四川省',
    geoProvider: 'cn-atlas',
    geoCode: '510100',
    sortOrder: 10,
    title: '一个人，去没去过的地方',
    body: '车票买好了，行李还没收。第一次不等别人有空，给自己一次出发。',
    occurredOn: '2026-03-24',
  },
  {
    slug: 'chongqing',
    countryCode: 'CN',
    countryName: 'China',
    cityName: '重庆',
    regionName: null,
    geoProvider: 'cn-atlas',
    geoCode: '500000',
    sortOrder: 20,
    title: '第一次在新城市住下来',
    body: '纸箱还没拆，晚饭是便利店的饭团。城市很陌生，但风很自由。',
    occurredOn: '2026-01-05',
  },
  {
    slug: 'shanghai',
    countryCode: 'CN',
    countryName: 'China',
    cityName: '上海',
    regionName: null,
    geoProvider: 'cn-atlas',
    geoCode: '310000',
    sortOrder: 30,
    title: '第一次认真逛一座陌生城市',
    body: '沿着街道慢慢走，第一次认真观察一座陌生城市的日常。',
    occurredOn: '2026-05-12',
  },
  {
    slug: 'tokyo',
    countryCode: 'JP',
    countryName: 'Japan',
    cityName: '东京',
    regionName: 'Tokyo',
    geoProvider: 'japan-prefecture',
    geoCode: '13',
    sortOrder: 40,
    title: '第一次认真逛一座陌生城市',
    body: '在秩序和细节里，重新观察公共空间如何照顾人的移动和停留。',
    occurredOn: '2026-02-18',
  },
  {
    slug: 'osaka',
    countryCode: 'JP',
    countryName: 'Japan',
    cityName: '大阪',
    regionName: 'Osaka',
    geoProvider: 'japan-prefecture',
    geoCode: '27',
    sortOrder: 50,
    title: '在大阪的第一顿便利店晚饭',
    body: '刚到的时候什么都还不熟，但夜里的街道很好走。',
    occurredOn: '2026-02-21',
  },
  {
    slug: 'kyoto',
    countryCode: 'JP',
    countryName: 'Japan',
    cityName: '京都',
    regionName: 'Kyoto',
    geoProvider: 'japan-prefecture',
    geoCode: '26',
    sortOrder: 60,
    title: '在京都慢慢走了一天',
    body: '没有赶路，只是沿着街道和神社慢慢走。',
    occurredOn: '2026-02-24',
  },
  {
    slug: 'oslo',
    countryCode: 'NO',
    countryName: 'Norway',
    cityName: '奥斯陆',
    regionName: null,
    geoProvider: 'world-geojson',
    geoCode: 'NO',
    sortOrder: 70,
    title: '有一天，一起去看极光',
    body: '有些坐标来自记忆，有些坐标则先来自期待。',
    occurredOn: '2026-03-12',
  },
] as const;

export async function seedFootprintDefaults(prisma: PrismaClient) {
  for (const item of defaults) {
    const city = await prisma.footprintCity.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        countryCode: item.countryCode,
        countryName: item.countryName,
        cityName: item.cityName,
        regionName: item.regionName,
        geoProvider: item.geoProvider,
        geoCode: item.geoCode,
        localGeoJsonPath: null,
        sortOrder: item.sortOrder,
      },
      update: {},
    });
    if (city.geoProvider === 'fixture' && item.geoProvider !== 'fixture') {
      await prisma.footprintCity.update({
        where: { id: city.id },
        data: {
          geoProvider: item.geoProvider,
          geoCode: item.geoCode,
          localGeoJsonPath: null,
        },
      });
    }
    const existingMemory = await prisma.footprintMemory.findFirst({
      where: { cityId: city.id, title: item.title },
    });
    if (existingMemory) continue;
    await prisma.footprintMemory.create({
      data: {
        cityId: city.id,
        title: item.title,
        body: item.body,
        occurredOn: item.occurredOn ? new Date(`${item.occurredOn}T00:00:00.000Z`) : null,
        sortOrder: 0,
        visible: true,
      },
    });
  }
}
