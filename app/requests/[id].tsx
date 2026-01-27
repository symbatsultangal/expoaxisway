import React from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { requestsApi } from '@/services/api/requests';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isDisabledPerson } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestsApi.getDetails(id!),
    enabled: !!id,
    retry: 1, // Fail fast if RLS blocks
  });

  const acceptMutation = useMutation({
    mutationFn: (volId: string) => requestsApi.acceptVolunteer(id!, volId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      Alert.alert('Success', 'Volunteer accepted!');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const completeMutation = useMutation({
    mutationFn: () => requestsApi.completeRequest(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      Alert.alert('Success', 'Request marked completed.');
    },
  });

  if (isLoading) return <ThemedView style={styles.center}><ActivityIndicator /></ThemedView>;
  if (error || !request) return <ThemedView style={styles.center}><ThemedText>Request not found or access denied.</ThemedText></ThemedView>;

  const isOwner = user?.id === request.requester_id;
  const status = request.status;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">Request #{id?.slice(0,4)}</ThemedText>
          <ThemedText style={styles.status}>{status.toUpperCase()}</ThemedText>
        </View>

        <Card title="Description">
           <ThemedText>{request.description}</ThemedText>
        </Card>

        {/* OWNER ACTIONS */}
        {isOwner && (
          <View style={styles.ownerSection}>
            <ThemedText type="subtitle">Manage Request</ThemedText>
            
            {status === 'created' && (
              <View>
                 <ThemedText style={styles.sectionLabel}>Candidates ({request.candidates?.length || 0})</ThemedText>
                 {request.candidates?.map((c: any) => (
                   <Card key={c.id} style={styles.candidateCard}>
                     <View style={styles.candidateRow}>
                        <View>
                           <ThemedText style={{fontWeight:'bold'}}>{c.volunteer.full_name}</ThemedText>
                           <ThemedText style={{fontSize:12}}>Verified: {c.volunteer.stats?.is_verified ? 'Yes' : 'No'}</ThemedText>
                        </View>
                        <Button 
                          size="sm" 
                          loading={acceptMutation.isPending} 
                          onPress={() => acceptMutation.mutate(c.volunteer_id)}
                        >
                          Accept
                        </Button>
                     </View>
                   </Card>
                 ))}
                 {(!request.candidates || request.candidates.length === 0) && (
                   <ThemedText style={{opacity:0.6, fontStyle:'italic'}}>Waiting for volunteers...</ThemedText>
                 )}
              </View>
            )}

            {status === 'in_progress' || status === 'accepted' ? (
              <Button 
                variant="default" 
                onPress={() => completeMutation.mutate()}
                loading={completeMutation.isPending}
              >
                Mark Completed
              </Button>
            ) : null}
          </View>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontWeight: 'bold', fontSize: 16, color: '#0a7ea4' },
  ownerSection: { gap: 16, marginTop: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  candidateCard: { padding: 12 },
  candidateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
