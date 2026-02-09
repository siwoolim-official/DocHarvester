import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Search, Trash2, Copy, ExternalLink, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface CrawlResponse {
  urls: string[];
}

export function UrlCollectorTool() {
  const [url, setUrl] = useState("");
  const [collectedUrls, setCollectedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const { toast } = useToast();

  const handleCrawl = async () => {
    if (!url) {
      toast({
        title: "URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // API 호출 (백엔드 포트 8080 가정, Vite 프록시 설정 필요할 수 있음)
      const response = await axios.post<string[]>("/api/tools/crawl", { url });
      setCollectedUrls(response.data);
      toast({
        title: "수집 완료",
        description: `${response.data.length}개의 URL을 수집했습니다.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "수집 실패",
        description: "URL 수집 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDuplicates = () => {
    const uniqueUrls = Array.from(new Set(collectedUrls));
    const removedCount = collectedUrls.length - uniqueUrls.length;
    setCollectedUrls(uniqueUrls);
    toast({
      title: "중복 제거 완료",
      description: `${removedCount}개의 중복 URL이 제거되었습니다.`,
    });
  };

  const handleCopy = () => {
    const text = collectedUrls.join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "복사되었습니다",
      description: "클립보드에 복사되었습니다.",
    });
  };

  const filteredUrls = collectedUrls.filter((u) =>
    u.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6" />
            스마트 URL 수집기
          </CardTitle>
          <CardDescription>
            시작 URL을 입력하면 하위 페이지를 자동으로 수집합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="https://example.com/docs"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleCrawl} disabled={loading}>
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "수집 중..." : "수집 시작"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm py-1 px-3">
          수집된 URL: {collectedUrls.length}개
        </Badge>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="결과 내 검색..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleRemoveDuplicates} title="중복 제거">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleCopy} title="전체 복사">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
           {filteredUrls.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              수집된 URL이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUrls.map((u, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm break-all">{u}</TableCell>
                    <TableCell>
                        <a href={u} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
